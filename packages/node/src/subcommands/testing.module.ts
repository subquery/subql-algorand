// Copyright 2020-2024 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import { Module } from '@nestjs/common';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import {
  ConnectionPoolService,
  ConnectionPoolStateManager,
  DbModule,
  InMemoryCacheService,
  PoiService,
  PoiSyncService,
  StoreCacheService,
  StoreService,
  TestRunner,
  SandboxService,
  NodeConfig,
  IStoreModelProvider,
  PlainStoreModelService,
} from '@subql/node-core';
import { Sequelize } from '@subql/x-sequelize';
import { AlgorandApiService } from '../algorand';
import { ConfigureModule } from '../configure/configure.module';
import { DsProcessorService } from '../indexer/ds-processor.service';
import { DynamicDsService } from '../indexer/dynamic-ds.service';
import { IndexerManager } from '../indexer/indexer.manager';
import { ProjectService } from '../indexer/project.service';
import { UnfinalizedBlocksService } from '../indexer/unfinalizedBlocks.service';
@Module({
  providers: [
    InMemoryCacheService,
    StoreService,
    {
      provide: 'IStoreModelProvider',
      useFactory: (
        nodeConfig: NodeConfig,
        eventEmitter: EventEmitter2,
        schedulerRegistry: SchedulerRegistry,
        sequelize: Sequelize,
      ): IStoreModelProvider => {
        return nodeConfig.enableCache
          ? new StoreCacheService(
              sequelize,
              nodeConfig,
              eventEmitter,
              schedulerRegistry,
            )
          : new PlainStoreModelService(sequelize, nodeConfig);
      },
      inject: [NodeConfig, EventEmitter2, SchedulerRegistry, Sequelize],
    },
    EventEmitter2,
    PoiService,
    PoiSyncService,
    SandboxService,
    DsProcessorService,
    DynamicDsService,
    UnfinalizedBlocksService,
    ConnectionPoolStateManager,
    ConnectionPoolService,
    {
      provide: 'IProjectService',
      useClass: ProjectService,
    },
    AlgorandApiService,
    SchedulerRegistry,
    TestRunner,
    {
      provide: 'IApi',
      useExisting: AlgorandApiService,
    },
    {
      provide: 'IIndexerManager',
      useClass: IndexerManager,
    },
  ],
  controllers: [],
  exports: [TestRunner],
})
export class TestingFeatureModule {}

@Module({
  imports: [
    DbModule.forRoot(),
    ConfigureModule.register(),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    TestingFeatureModule,
  ],
  controllers: [],
})
export class TestingModule {}
