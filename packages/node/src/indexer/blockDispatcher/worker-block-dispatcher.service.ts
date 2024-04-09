// Copyright 2020-2023 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import path from 'path';
import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  NodeConfig,
  SmartBatchService,
  StoreService,
  PoiSyncService,
  StoreCacheService,
  IProjectService,
  WorkerBlockDispatcher,
  ConnectionPoolStateManager,
  IProjectUpgradeService,
  InMemoryCacheService,
  createIndexerWorker,
} from '@subql/node-core';
import { AlgorandBlock } from '@subql/types-algorand';
import { AlgorandApiConnection } from '../../algorand';
import {
  AlgorandProjectDs,
  SubqueryProject,
} from '../../configure/SubqueryProject';
import { DynamicDsService } from '../dynamic-ds.service';
import { BlockContent } from '../types';
import { UnfinalizedBlocksService } from '../unfinalizedBlocks.service';
import { IIndexerWorker } from '../worker/worker';

type IndexerWorker = IIndexerWorker & {
  terminate: () => Promise<number>;
};

@Injectable()
export class WorkerBlockDispatcherService
  extends WorkerBlockDispatcher<AlgorandProjectDs, IndexerWorker, AlgorandBlock>
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
    cacheService: InMemoryCacheService,
    storeService: StoreService,
    storeCacheService: StoreCacheService,
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
      poiSyncService,
      project,
      dynamicDsService,
      () =>
        createIndexerWorker<
          IIndexerWorker,
          AlgorandApiConnection,
          BlockContent,
          AlgorandProjectDs
        >(
          path.resolve(__dirname, '../../../dist/indexer/worker/worker.js'),
          [],
          storeService.getStore(),
          cacheService.getCache(),
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
  }
}
