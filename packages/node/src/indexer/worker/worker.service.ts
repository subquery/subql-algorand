// Copyright 2020-2024 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import { Inject, Injectable } from '@nestjs/common';
import {
  NodeConfig,
  IProjectService,
  BaseWorkerService,
  IProjectUpgradeService,
  IBlock,
  ProcessBlockResponse,
  Header,
} from '@subql/node-core';
import { AlgorandBlock, AlgorandDataSource } from '@subql/types-algorand';
import { AlgorandApiService, algorandBlockToHeader } from '../../algorand';
import { IndexerManager } from '../indexer.manager';
import { BlockContent } from '../types';

export type FetchBlockResponse = Header;

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
    projectService: IProjectService<AlgorandDataSource>,
    @Inject('IProjectUpgradeService')
    projectUpgradeService: IProjectUpgradeService,
    nodeConfig: NodeConfig,
  ) {
    super(projectService, projectUpgradeService, nodeConfig);
  }

  protected async fetchChainBlock(
    heights: number,
  ): Promise<IBlock<AlgorandBlock>> {
    const [block] = await this.apiService.fetchBlocks([heights]);
    return block;
  }
  protected toBlockResponse(block: AlgorandBlock): Header {
    return {
      ...algorandBlockToHeader(block),
      parentHash: block.previousBlockHash,
    };
  }
  protected async processFetchedBlock(
    block: IBlock<AlgorandBlock>,
    dataSources: AlgorandDataSource[],
  ): Promise<ProcessBlockResponse> {
    return this.indexerManager.indexBlock(block, dataSources);
  }
}
