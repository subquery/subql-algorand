// Copyright 2020-2025 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import { Module } from '@nestjs/common';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  ConnectionPoolService,
  ConnectionPoolStateManager,
  DbModule,
  DsProcessorService,
  DynamicDsService,
  ForceCleanService,
  MultiChainRewindService,
  NodeConfig,
  PoiService,
  ReindexService,
  storeModelFactory,
  StoreService,
  UnfinalizedBlocksService,
} from '@subql/node-core';
import { Sequelize } from '@subql/x-sequelize';
import { AlgorandApiService } from '../algorand';
import { BlockchainService } from '../blockchain.service';
import { ConfigureModule } from '../configure/configure.module';

@Module({
  providers: [
    {
      provide: 'IStoreModelProvider',
      useFactory: storeModelFactory,
      inject: [NodeConfig, EventEmitter2, Sequelize],
    },
    StoreService,
    ReindexService,
    PoiService,
    ForceCleanService,
    {
      provide: 'UnfinalizedBlocksService',
      useClass: UnfinalizedBlocksService,
    },
    {
      provide: 'DynamicDsService',
      useClass: DynamicDsService,
    },
    DsProcessorService,
    ConnectionPoolStateManager,
    ConnectionPoolService,
    {
      // Used to work with DI for unfinalizedBlocksService but not used with reindex
      provide: 'APIService',
      useFactory: AlgorandApiService.init,
      inject: ['ISubqueryProject', ConnectionPoolService, EventEmitter2],
    },
    {
      provide: 'IBlockchainService',
      useClass: BlockchainService,
    },
    MultiChainRewindService,
    SchedulerRegistry,
  ],
  controllers: [],
})
export class ReindexFeatureModule {}

@Module({
  imports: [
    DbModule.forRoot(),
    ConfigureModule.register(),
    ReindexFeatureModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [],
})
export class ReindexModule {}
