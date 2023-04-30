// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  NodeConfig,
  SmartBatchService,
  StoreCacheService,
  StoreService,
  IProjectService,
  PoiService,
  BlockDispatcher,
  ProcessBlockResponse,
} from '@subql/node-core';
import { AlgorandBlock } from '@subql/types-algorand';
import { AlgorandApiService } from '../../algorand';
import {
  SubqlProjectDs,
  SubqueryProject,
} from '../../configure/SubqueryProject';
import { DynamicDsService } from '../dynamic-ds.service';
import { IndexerManager } from '../indexer.manager';

/**
 * @description Intended to behave the same as WorkerBlockDispatcherService but doesn't use worker threads or any parallel processing
 */
@Injectable()
export class BlockDispatcherService
  extends BlockDispatcher<AlgorandBlock, SubqlProjectDs>
  implements OnApplicationShutdown
{
  constructor(
    private apiService: AlgorandApiService,
    nodeConfig: NodeConfig,
    private indexerManager: IndexerManager,
    eventEmitter: EventEmitter2,
    @Inject('IProjectService') projectService: IProjectService<SubqlProjectDs>,
    smartBatchService: SmartBatchService,
    storeService: StoreService,
    storeCacheService: StoreCacheService,
    poiService: PoiService,
    @Inject('ISubqueryProject') project: SubqueryProject,
    dynamicDsService: DynamicDsService,
  ) {
    super(
      nodeConfig,
      eventEmitter,
      projectService,
      smartBatchService,
      storeService,
      storeCacheService,
      poiService,
      project,
      dynamicDsService,
      async (blockNums: number[]): Promise<AlgorandBlock[]> => {
        // If specVersion not changed, a known overallSpecVer will be pass in
        // Otherwise use api to fetch runtimes
        return this.apiService.fetchBlocks(blockNums);
      },
    );
  }

  protected getBlockHeight(block: AlgorandBlock): number {
    return block.round;
  }

  protected async indexBlock(
    block: AlgorandBlock,
  ): Promise<ProcessBlockResponse> {
    return this.indexerManager.indexBlock(
      block,
      await this.projectService.getAllDataSources(this.getBlockHeight(block)),
    );
  }
}
