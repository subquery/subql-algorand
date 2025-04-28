// Copyright 2020-2025 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import path from 'node:path';
import { Module } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  StoreService,
  PoiSyncService,
  NodeConfig,
  ConnectionPoolService,
  ConnectionPoolStateManager,
  InMemoryCacheService,
  MonitorService,
  CoreModule,
  blockDispatcherFactory,
  DsProcessorService,
  DynamicDsService,
  UnfinalizedBlocksService,
  ProjectService,
  MultiChainRewindService,
  DictionaryService,
  FetchService,
} from '@subql/node-core';
import { AlgorandApiService } from '../algorand';
import { BlockchainService } from '../blockchain.service';
import { AlgorandDictionaryService } from './dictionary';
import { IndexerManager } from './indexer.manager';

@Module({
  imports: [CoreModule],
  providers: [
    {
      provide: 'APIService',
      useFactory: AlgorandApiService.init,
      inject: ['ISubqueryProject', ConnectionPoolService, EventEmitter2],
    },
    {
      provide: 'IBlockchainService',
      useClass: BlockchainService,
    },
    DsProcessorService,
    DynamicDsService,
    {
      provide: 'IUnfinalizedBlocksService',
      useClass: UnfinalizedBlocksService,
    },
    {
      useClass: ProjectService,
      provide: 'IProjectService',
    },
    MultiChainRewindService,
    IndexerManager,
    {
      provide: 'IBlockDispatcher',
      useFactory: blockDispatcherFactory(
        path.resolve(__dirname, '../../dist/indexer/worker/worker.js'),
        [],
      ),
      inject: [
        NodeConfig,
        EventEmitter2,
        'IProjectService',
        'IProjectUpgradeService',
        InMemoryCacheService,
        StoreService,
        'IStoreModelProvider',
        PoiSyncService,
        'ISubqueryProject',
        DynamicDsService,
        'IUnfinalizedBlocksService',
        ConnectionPoolStateManager,
        'IBlockchainService',
        IndexerManager,
        MultiChainRewindService,
        MonitorService,
      ],
    },
    FetchService,
    {
      provide: DictionaryService,
      useClass: AlgorandDictionaryService,
    },
  ],
})
export class FetchModule {}
