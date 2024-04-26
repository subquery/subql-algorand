// Copyright 2020-2024 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import { Module } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  PoiBenchmarkService,
  IndexingBenchmarkService,
  StoreService,
  PoiService,
  PoiSyncService,
  NodeConfig,
  ConnectionPoolService,
  StoreCacheService,
  ConnectionPoolStateManager,
  IProjectUpgradeService,
  InMemoryCacheService,
  SandboxService,
} from '@subql/node-core';
import { AlgorandApiConnection, AlgorandApiService } from '../algorand';
import { SubqueryProject } from '../configure/SubqueryProject';
import {
  BlockDispatcherService,
  WorkerBlockDispatcherService,
} from './blockDispatcher';
import { AlgorandDictionaryService } from './dictionary';
import { DsProcessorService } from './ds-processor.service';
import { DynamicDsService } from './dynamic-ds.service';
import { FetchService } from './fetch.service';
import { IndexerManager } from './indexer.manager';
import { ProjectService } from './project.service';
import { UnfinalizedBlocksService } from './unfinalizedBlocks.service';

@Module({
  providers: [
    InMemoryCacheService,
    StoreService,
    StoreCacheService,
    ConnectionPoolService,
    UnfinalizedBlocksService,
    {
      provide: AlgorandApiService,
      useFactory: async (
        project: SubqueryProject,
        connectionPoolService: ConnectionPoolService<AlgorandApiConnection>,
        eventEmitter: EventEmitter2,
      ) => {
        const apiService = new AlgorandApiService(
          project,
          connectionPoolService,
          eventEmitter,
        );
        await apiService.init();
        return apiService;
      },
      inject: ['ISubqueryProject', ConnectionPoolService, EventEmitter2],
    },
    IndexerManager,
    ConnectionPoolStateManager,
    {
      provide: 'IBlockDispatcher',
      useFactory: (
        nodeConfig: NodeConfig,
        eventEmitter: EventEmitter2,
        projectService: ProjectService,
        projectUpgradeService: IProjectUpgradeService,
        apiService: AlgorandApiService,
        indexerManager: IndexerManager,
        cacheService: InMemoryCacheService,
        storeService: StoreService,
        storeCacheService: StoreCacheService,
        poiSyncService: PoiSyncService,
        project: SubqueryProject,
        dynamicDsService: DynamicDsService,
        unfinalizedBlocksService: UnfinalizedBlocksService,
        connectionPoolState: ConnectionPoolStateManager<AlgorandApiConnection>,
      ) =>
        nodeConfig.workers
          ? new WorkerBlockDispatcherService(
              nodeConfig,
              eventEmitter,
              projectService,
              projectUpgradeService,
              cacheService,
              storeService,
              storeCacheService,
              poiSyncService,
              project,
              dynamicDsService,
              unfinalizedBlocksService,
              connectionPoolState,
            )
          : new BlockDispatcherService(
              apiService,
              nodeConfig,
              indexerManager,
              eventEmitter,
              projectService,
              projectUpgradeService,
              storeService,
              storeCacheService,
              poiSyncService,
              project,
            ),
      inject: [
        NodeConfig,
        EventEmitter2,
        'IProjectService',
        'IProjectUpgradeService',
        AlgorandApiService,
        IndexerManager,
        InMemoryCacheService,
        StoreService,
        StoreCacheService,
        PoiSyncService,
        'ISubqueryProject',
        DynamicDsService,
        UnfinalizedBlocksService,
        ConnectionPoolStateManager,
      ],
    },
    FetchService,
    ConnectionPoolService,
    IndexingBenchmarkService,
    PoiBenchmarkService,
    AlgorandDictionaryService,
    SandboxService,
    DsProcessorService,
    DynamicDsService,
    PoiService,
    PoiSyncService,
    {
      useClass: ProjectService,
      provide: 'IProjectService',
    },
  ],
  exports: [StoreService, StoreCacheService],
})
export class FetchModule {}
