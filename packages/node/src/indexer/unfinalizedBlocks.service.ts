// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Injectable } from '@nestjs/common';
import {
  BaseUnfinalizedBlocksService,
  Header,
  NodeConfig,
  StoreCacheService,
} from '@subql/node-core';
import { AlgorandApiService } from '../algorand';
import { BlockContent } from './types';

export function algorandBlockToHeader(block: BlockContent): Header {
  return {
    blockHeight: block.round,
    blockHash: block.round.toString(),
    parentHash: block.previousBlockHash,
  };
}

@Injectable()
export class UnfinalizedBlocksService extends BaseUnfinalizedBlocksService<BlockContent> {
  constructor(
    private readonly apiService: AlgorandApiService,
    nodeConfig: NodeConfig,
    storeCache: StoreCacheService,
  ) {
    super(nodeConfig, storeCache);
  }

  protected blockToHeader(block: BlockContent): Header {
    return algorandBlockToHeader(block);
  }

  protected async getFinalizedHead(): Promise<Header> {
    const checkHealth = await this.apiService.api.api.makeHealthCheck().do();
    const latestHeight = checkHealth.round;
    return this.getHeaderForHeight(latestHeight);
  }

  protected async getHeaderForHash(hash: string): Promise<Header> {
    return this.getHeaderForHeight(parseInt(hash, 10));
  }

  protected async getHeaderForHeight(height: number): Promise<Header> {
    return algorandBlockToHeader(
      await this.apiService.api.getBlockByHeight(height),
    );
  }
}
