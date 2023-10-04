// Copyright 2020-2023 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import { Inject, Injectable } from '@nestjs/common';
import {
  NodeConfig,
  IProjectService,
  BaseWorkerService,
  IProjectUpgradeService,
} from '@subql/node-core';
import { AlgorandBlock, AlgorandDataSource } from '@subql/types-algorand';
import { AlgorandApiService } from '../../algorand';
import { AlgorandProjectDs } from '../../configure/SubqueryProject';
import { IndexerManager } from '../indexer.manager';
import { BlockContent } from '../types';

export type FetchBlockResponse = { parentHash: string } | undefined;

export type ProcessBlockResponse = {
  dynamicDsCreated: boolean;
  blockHash: string;
  reindexBlockHeight: number;
};

export type WorkerStatusResponse = {
  threadId: number;
  isIndexing: boolean;
  fetchedBlocks: number;
  toFetchBlocks: number;
};

@Injectable()
export class WorkerService extends BaseWorkerService<
  BlockContent,
  FetchBlockResponse,
  AlgorandDataSource,
  {}
> {
  constructor(
    private apiService: AlgorandApiService,
    private indexerManager: IndexerManager,
    @Inject('IProjectService')
    projectService: IProjectService<AlgorandProjectDs>,
    @Inject('IProjectUpgradeService')
    projectUpgradeService: IProjectUpgradeService,
    nodeConfig: NodeConfig,
  ) {
    super(projectService, projectUpgradeService, nodeConfig);
  }

  protected async fetchChainBlock(heights: number): Promise<AlgorandBlock> {
    const [block] = await this.apiService.fetchBlocks([heights]);
    return block;
  }
  protected toBlockResponse(block: AlgorandBlock): { parentHash: string } {
    return {
      parentHash: block.previousBlockHash,
    };
  }
  protected async processFetchedBlock(
    block: AlgorandBlock,
    dataSources: AlgorandDataSource[],
  ): Promise<ProcessBlockResponse> {
    return this.indexerManager.indexBlock(block, dataSources);
  }
}
