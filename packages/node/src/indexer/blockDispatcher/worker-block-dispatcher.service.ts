// Copyright 2020-2023 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import path from 'path';
import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  NodeConfig,
  Worker,
  SmartBatchService,
  StoreService,
  PoiService,
  PoiSyncService,
  StoreCacheService,
  IProjectService,
  IDynamicDsService,
  HostStore,
  HostDynamicDS,
  WorkerBlockDispatcher,
  IUnfinalizedBlocksService,
  HostConnectionPoolState,
  ConnectionPoolStateManager,
  connectionPoolStateHostFunctions,
  baseWorkerFunctions,
  storeHostFunctions,
  dynamicDsHostFunctions,
  IProjectUpgradeService,
  HostUnfinalizedBlocks,
} from '@subql/node-core';
import { Store } from '@subql/types-core';
import { AlgorandApiConnection } from '../../algorand';
import {
  AlgorandProjectDs,
  SubqueryProject,
} from '../../configure/SubqueryProject';
import { DynamicDsService } from '../dynamic-ds.service';
import { BlockContent } from '../types';
import { UnfinalizedBlocksService } from '../unfinalizedBlocks.service';
import { IIndexerWorker, IInitIndexerWorker } from '../worker/worker';

type IndexerWorker = IIndexerWorker & {
  terminate: () => Promise<number>;
};

async function createIndexerWorker(
  store: Store,
  dynamicDsService: IDynamicDsService<AlgorandProjectDs>,
  unfinalizedBlocksService: IUnfinalizedBlocksService<BlockContent>,
  connectionPoolState: ConnectionPoolStateManager<AlgorandApiConnection>,
  root: string,
  startHeight: number,
): Promise<IndexerWorker> {
  const indexerWorker = Worker.create<
    IInitIndexerWorker,
    // HostDynamicDS<AlgorandProjectDs> & HostStore & HostUnfinalizedBlocks
    HostDynamicDS<AlgorandProjectDs> &
      HostStore &
      HostUnfinalizedBlocks &
      HostConnectionPoolState<AlgorandApiConnection>
  >(
    path.resolve(__dirname, '../../../dist/indexer/worker/worker.js'),
    [...baseWorkerFunctions, 'initWorker'],
    {
      ...storeHostFunctions(store),
      ...dynamicDsHostFunctions(dynamicDsService),
      unfinalizedBlocksProcess:
        unfinalizedBlocksService.processUnfinalizedBlockHeader.bind(
          unfinalizedBlocksService,
        ),
      ...connectionPoolStateHostFunctions(connectionPoolState),
    },
    root,
  );

  await indexerWorker.initWorker(startHeight);

  return indexerWorker;
}

@Injectable()
export class WorkerBlockDispatcherService
  extends WorkerBlockDispatcher<AlgorandProjectDs, IndexerWorker>
  implements OnApplicationShutdown
{
  constructor(
    nodeConfig: NodeConfig,
    eventEmitter: EventEmitter2,
    @Inject('IProjectService')
    projectService: IProjectService<AlgorandProjectDs>,
    @Inject('IProjectUpgradeService')
    projectUpgadeService: IProjectUpgradeService,
    smartBatchService: SmartBatchService,
    storeService: StoreService,
    storeCacheService: StoreCacheService,
    poiService: PoiService,
    poiSyncService: PoiSyncService,
    @Inject('ISubqueryProject') project: SubqueryProject,
    dynamicDsService: DynamicDsService,
    unfinalizedBlocksService: UnfinalizedBlocksService,
    connectionPoolState: ConnectionPoolStateManager<AlgorandApiConnection>,
  ) {
    super(
      nodeConfig,
      eventEmitter,
      projectService,
      projectUpgadeService,
      smartBatchService,
      storeService,
      storeCacheService,
      poiService,
      poiSyncService,
      project,
      dynamicDsService,
      () =>
        createIndexerWorker(
          storeService.getStore(),
          dynamicDsService,
          unfinalizedBlocksService,
          connectionPoolState,
          project.root,
          projectService.startHeight,
        ),
    );
  }

  protected async fetchBlock(
    worker: IndexerWorker,
    height: number,
  ): Promise<void> {
    // const start = new Date();
    await worker.fetchBlock(height, null);
    // const end = new Date();

    // const waitTime = end.getTime() - start.getTime();
    // if (waitTime > 1000) {
    //   logger.info(
    //     `Waiting to fetch block ${height}: ${chalk.red(`${waitTime}ms`)}`,
    //   );
    // } else if (waitTime > 200) {
    //   logger.info(
    //     `Waiting to fetch block ${height}: ${chalk.yellow(`${waitTime}ms`)}`,
    //   );
    // }
  }
}
