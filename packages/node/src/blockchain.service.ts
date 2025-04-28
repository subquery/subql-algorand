// Copyright 2020-2025 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import { Inject } from '@nestjs/common';
import {
  AlgorandCustomDataSource,
  AlgorandDataSource,
  AlgorandHandlerKind,
  isCustomDs,
  isRuntimeDs,
} from '@subql/common-algorand';
import {
  IBlockchainService,
  DatasourceParams,
  Header,
  IBlock,
} from '@subql/node-core';
import { SafeAPI } from '@subql/types-algorand';
import { TransactionType } from 'algosdk';
import {
  AlgorandApiService,
  algorandBlockToHeader,
  calcInterval,
  SafeAPIService,
} from './algorand';
import { SubqueryProject } from './configure/SubqueryProject';
import { BlockContent, getBlockSize } from './indexer/types';
import { IIndexerWorker } from './indexer/worker/worker';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version: packageVersion } = require('../package.json');

const BLOCK_TIME_VARIANCE = 5000; //ms

const INTERVAL_PERCENT = 0.9;

export class BlockchainService
  implements
    IBlockchainService<
      AlgorandDataSource,
      AlgorandCustomDataSource,
      SubqueryProject,
      SafeAPI,
      BlockContent, // Light block
      BlockContent,
      IIndexerWorker
    >
{
  constructor(@Inject('APIService') private apiService: AlgorandApiService) {}

  isCustomDs = isCustomDs;
  isRuntimeDs = isRuntimeDs;
  blockHandlerKind = AlgorandHandlerKind.Block;
  packageVersion = packageVersion;

  async fetchBlocks(blockNums: number[]): Promise<IBlock<BlockContent>[]> {
    return this.apiService.fetchBlocks(blockNums);
  }

  async fetchBlockWorker(
    worker: IIndexerWorker,
    blockNum: number,
    context: { workers: IIndexerWorker[] },
  ): Promise<Header> {
    return worker.fetchBlock(blockNum, 0);
  }

  getBlockSize(block: IBlock<BlockContent>): number {
    return getBlockSize(block.block);
  }

  async getFinalizedHeader(): Promise<Header> {
    const block = await this.apiService.api.getLatestBlockHeader();
    return algorandBlockToHeader(block);
  }

  async getBestHeight(): Promise<number> {
    const checkHealth = await this.apiService.api.api.makeHealthCheck().do();
    return checkHealth.round;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async getChainInterval(): Promise<number> {
    const CHAIN_INTERVAL =
      calcInterval(this.apiService.api.api) * INTERVAL_PERCENT;

    return Math.min(BLOCK_TIME_VARIANCE, CHAIN_INTERVAL);
  }

  async getHeaderForHash(hash: string): Promise<Header> {
    return this.getHeaderForHeight(parseInt(hash, 10));
  }

  async getHeaderForHeight(height: number): Promise<Header> {
    return algorandBlockToHeader(
      await this.apiService.api.getHeaderOnly(height),
    );
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async updateDynamicDs(
    params: DatasourceParams,
    dsObj: AlgorandDataSource | AlgorandCustomDataSource,
  ): Promise<void> {
    if (isCustomDs(dsObj)) {
      dsObj.processor.options = {
        ...dsObj.processor.options,
        ...params.args,
      };
      // await this.dsProcessorService.validateCustomDs([dsObj]);
    } else if (isRuntimeDs(dsObj)) {
      dsObj.mapping.handlers.forEach((handler) => {
        handler.filter = { ...handler.filter, txType: TransactionType.appl };
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async getSafeApi(block: BlockContent): Promise<SafeAPIService> {
    return this.apiService.safeApi(block.round);
  }

  onProjectChange(project: SubqueryProject): Promise<void> | void {
    // this.apiService.updateBlockFetching();
  }

  async getBlockTimestamp(height: number): Promise<Date> {
    const { timestamp } = await this.getHeaderForHeight(height);
    return timestamp;
  }
}
