// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Module } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BenchmarkService,
  MmrService,
  StoreService,
  PoiService,
  NodeConfig,
} from '@subql/node-core';
import { AlgorandApiService } from '../algorand';
import { SubqueryProject } from '../configure/SubqueryProject';
import {
  BlockDispatcherService,
  WorkerBlockDispatcherService,
} from './blockDispatcher';
import { DictionaryService } from './dictionary.service';
import { DsProcessorService } from './ds-processor.service';
import { DynamicDsService } from './dynamic-ds.service';
import { FetchService } from './fetch.service';
import { IndexerManager } from './indexer.manager';
import { ProjectService } from './project.service';
import { SandboxService } from './sandbox.service';

@Module({
  providers: [
    StoreService,
    {
      provide: AlgorandApiService,
      useFactory: async (
        project: SubqueryProject,
        eventEmitter: EventEmitter2,
      ) => {
        const apiService = new AlgorandApiService(project, eventEmitter);
        await apiService.init();
        return apiService;
      },
      inject: ['ISubqueryProject', EventEmitter2],
    },
    IndexerManager,
    {
      provide: 'IBlockDispatcher',
      useFactory: (
        nodeConfig: NodeConfig,
        eventEmitter: EventEmitter2,
        projectService: ProjectService,
        apiService: AlgorandApiService,
        indexerManager: IndexerManager,
      ) =>
        nodeConfig.workers !== undefined
          ? new WorkerBlockDispatcherService(
              nodeConfig,
              eventEmitter,
              projectService,
            )
          : new BlockDispatcherService(
              apiService,
              nodeConfig,
              indexerManager,
              eventEmitter,
              projectService,
            ),
      inject: [
        NodeConfig,
        EventEmitter2,
        ProjectService,
        AlgorandApiService,
        IndexerManager,
      ],
    },
    FetchService,
    BenchmarkService,
    {
      provide: DictionaryService,
      useFactory: async (project: SubqueryProject, nodeConfig: NodeConfig) => {
        const dictionaryService = new DictionaryService(project, nodeConfig);
        await dictionaryService.init();
        return dictionaryService;
      },
      inject: ['ISubqueryProject', NodeConfig],
    },
    SandboxService,
    DsProcessorService,
    DynamicDsService,
    PoiService,
    MmrService,
    ProjectService,
  ],
  exports: [StoreService, MmrService],
})
export class FetchModule {}
