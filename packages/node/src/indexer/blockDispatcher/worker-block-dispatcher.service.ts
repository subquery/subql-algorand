// Copyright 2020-2025 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import path from 'path';
import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  NodeConfig,
  StoreService,
  PoiSyncService,
  IProjectService,
  WorkerBlockDispatcher,
  ConnectionPoolStateManager,
  IProjectUpgradeService,
  InMemoryCacheService,
  createIndexerWorker,
  MonitorServiceInterface,
  IStoreModelProvider,
} from '@subql/node-core';
import { AlgorandBlock, AlgorandDataSource } from '@subql/types-algorand';
import { AlgorandApiConnection } from '../../algorand';
import { SubqueryProject } from '../../configure/SubqueryProject';
import { DynamicDsService } from '../dynamic-ds.service';
import { BlockContent } from '../types';
import { UnfinalizedBlocksService } from '../unfinalizedBlocks.service';
import { IIndexerWorker } from '../worker/worker';
import { FetchBlockResponse } from '../worker/worker.service';

type IndexerWorker = IIndexerWorker & {
  terminate: () => Promise<number>;
};

@Injectable()
export class WorkerBlockDispatcherService
  extends WorkerBlockDispatcher<
    AlgorandDataSource,
    IndexerWorker,
    AlgorandBlock
  >
  implements OnApplicationShutdown
{
  constructor(
    nodeConfig: NodeConfig,
    eventEmitter: EventEmitter2,
    @Inject('IProjectService')
    projectService: IProjectService<AlgorandDataSource>,
    @Inject('IProjectUpgradeService')
    projectUpgadeService: IProjectUpgradeService,
    cacheService: InMemoryCacheService,
    storeService: StoreService,
    @Inject('IStoreModelProvider') storeModelProvider: IStoreModelProvider,
    poiSyncService: PoiSyncService,
    @Inject('ISubqueryProject') project: SubqueryProject,
    dynamicDsService: DynamicDsService,
    unfinalizedBlocksService: UnfinalizedBlocksService,
    connectionPoolState: ConnectionPoolStateManager<AlgorandApiConnection>,
    monitorService?: MonitorServiceInterface,
  ) {
    super(
      nodeConfig,
      eventEmitter,
      projectService,
      projectUpgadeService,
      storeService,
      storeModelProvider,
      poiSyncService,
      project,
      () =>
        createIndexerWorker<
          IIndexerWorker,
          AlgorandApiConnection,
          BlockContent,
          AlgorandDataSource
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
          monitorService,
        ),
      monitorService,
    );
  }

  protected async fetchBlock(
    worker: IndexerWorker,
    height: number,
  ): Promise<FetchBlockResponse> {
    return worker.fetchBlock(height, 0 /* Unused with algorand */);
  }
}
