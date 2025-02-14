// Copyright 2020-2024 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import { Module } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ConnectionPoolService,
  WorkerDynamicDsService,
  WorkerUnfinalizedBlocksService,
  WorkerCoreModule,
} from '@subql/node-core';
import { AlgorandApiService, AlgorandApiConnection } from '../../algorand';
import { SubqueryProject } from '../../configure/SubqueryProject';
import { DsProcessorService } from '../ds-processor.service';
import { DynamicDsService } from '../dynamic-ds.service';
import { IndexerManager } from '../indexer.manager';
import { ProjectService } from '../project.service';
import { UnfinalizedBlocksService } from '../unfinalizedBlocks.service';
import { WorkerService } from './worker.service';

@Module({
  imports: [WorkerCoreModule],
  providers: [
    IndexerManager,
    {
      provide: AlgorandApiService,
      useFactory: AlgorandApiService.init,
      inject: ['ISubqueryProject', ConnectionPoolService, EventEmitter2],
    },
    DsProcessorService,
    {
      provide: DynamicDsService,
      useFactory: () => new WorkerDynamicDsService((global as any).host),
    },
    {
      provide: 'IProjectService',
      useClass: ProjectService,
    },
    {
      provide: UnfinalizedBlocksService,
      useFactory: () =>
        new WorkerUnfinalizedBlocksService((global as any).host),
    },
    WorkerService,
  ],
  exports: [],
})
export class WorkerFetchModule {}
