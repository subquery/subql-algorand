// Copyright 2020-2025 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import { Module } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ConnectionPoolService,
  DsProcessorService,
  ProjectService,
  WorkerCoreModule,
} from '@subql/node-core';
import { AlgorandApiService } from '../../algorand';
import { BlockchainService } from '../../blockchain.service';
import { IndexerManager } from '../indexer.manager';
import { WorkerService } from './worker.service';

@Module({
  imports: [WorkerCoreModule],
  providers: [
    DsProcessorService,
    IndexerManager,
    {
      provide: 'APIService',
      useFactory: AlgorandApiService.init,
      inject: ['ISubqueryProject', ConnectionPoolService, EventEmitter2],
    },
    {
      provide: 'IProjectService',
      useClass: ProjectService,
    },
    {
      provide: 'IBlockchainService',
      useClass: BlockchainService,
    },
    WorkerService,
  ],
  exports: [],
})
export class WorkerFetchModule {}
