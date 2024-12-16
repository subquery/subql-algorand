// Copyright 2020-2024 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  NodeConfig,
  IStoreModelProvider,
  StoreService,
  IProjectService,
  PoiSyncService,
  BlockDispatcher,
  ProcessBlockResponse,
  IProjectUpgradeService,
  IBlock,
} from '@subql/node-core';
import { AlgorandBlock, AlgorandDataSource } from '@subql/types-algorand';
import { AlgorandApiService } from '../../algorand';
import { SubqueryProject } from '../../configure/SubqueryProject';
import { IndexerManager } from '../indexer.manager';
import { getBlockSize } from '../types';

/**
 * @description Intended to behave the same as WorkerBlockDispatcherService but doesn't use worker threads or any parallel processing
 */
@Injectable()
export class BlockDispatcherService
  extends BlockDispatcher<AlgorandBlock, AlgorandDataSource>
  implements OnApplicationShutdown
{
  constructor(
    apiService: AlgorandApiService,
    nodeConfig: NodeConfig,
    private indexerManager: IndexerManager,
    eventEmitter: EventEmitter2,
    @Inject('IProjectService')
    projectService: IProjectService<AlgorandDataSource>,
    @Inject('IProjectUpgradeService')
    projectUpgradeService: IProjectUpgradeService,
    storeService: StoreService,
    @Inject('IStoreModelProvider') storeModelProvider: IStoreModelProvider,
    poiSyncService: PoiSyncService,
    @Inject('ISubqueryProject') project: SubqueryProject,
  ) {
    super(
      nodeConfig,
      eventEmitter,
      projectService,
      projectUpgradeService,
      storeService,
      storeModelProvider,
      poiSyncService,
      project,
      apiService.fetchBlocks.bind(apiService),
    );
  }

  protected getBlockHeight(block: AlgorandBlock): number {
    return block.round;
  }

  protected async indexBlock(
    block: IBlock<AlgorandBlock>,
  ): Promise<ProcessBlockResponse> {
    return this.indexerManager.indexBlock(
      block,
      await this.projectService.getDataSources(block.getHeader().blockHeight),
    );
  }

  protected getBlockSize(block: IBlock<AlgorandBlock>): number {
    return getBlockSize(block.block);
  }
}
