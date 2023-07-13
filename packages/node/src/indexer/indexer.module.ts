// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { isMainThread } from 'worker_threads';
import { Module } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  StoreService,
  PoiService,
  MmrService,
  ConnectionPoolService,
  StoreCacheService,
  WorkerDynamicDsService,
  PgMmrCacheService,
  MmrQueryService,
} from '@subql/node-core';
import { AlgorandApiService, AlgorandApiConnection } from '../algorand';
import { SubqueryProject } from '../configure/SubqueryProject';
import { DsProcessorService } from './ds-processor.service';
import { DynamicDsService } from './dynamic-ds.service';
import { IndexerManager } from './indexer.manager';
import { ProjectService } from './project.service';
import { SandboxService } from './sandbox.service';
import { UnfinalizedBlocksService } from './unfinalizedBlocks.service';
import { WorkerService } from './worker/worker.service';

@Module({
  providers: [
    IndexerManager,
    StoreCacheService,
    StoreService,
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
    SandboxService,
    DsProcessorService,
    {
      provide: DynamicDsService,
      useFactory: () => {
        if (isMainThread) {
          throw new Error('Expected to be worker thread');
        }
        return new WorkerDynamicDsService((global as any).host);
      },
    },
    PoiService,
    MmrService,
    PgMmrCacheService,
    MmrQueryService,
    {
      provide: 'IProjectService',
      useClass: ProjectService,
    },
    WorkerService,
  ],
  exports: [StoreService, MmrService, MmrQueryService],
})
export class IndexerModule {}
