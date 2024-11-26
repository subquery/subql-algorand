// Copyright 2020-2024 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import { Module } from '@nestjs/common';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  DbModule,
  ForceCleanService,
  NodeConfig,
  PoiService,
  ReindexService,
  storeModelFactory,
  StoreService,
} from '@subql/node-core';
import { Sequelize } from '@subql/x-sequelize';
import { AlgorandApiService } from '../algorand';
import { ConfigureModule } from '../configure/configure.module';
import { DsProcessorService } from '../indexer/ds-processor.service';
import { DynamicDsService } from '../indexer/dynamic-ds.service';

@Module({
  providers: [
    {
      provide: 'IStoreModelProvider',
      useFactory: storeModelFactory,
      inject: [NodeConfig, EventEmitter2, SchedulerRegistry, Sequelize],
    },
    StoreService,
    ReindexService,
    ForceCleanService,
    DynamicDsService,
    PoiService,
    DsProcessorService,
    {
      // Used to work with DI for unfinalizedBlocksService but not used with reindex
      provide: AlgorandApiService,
      useFactory: () => undefined,
    },
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
