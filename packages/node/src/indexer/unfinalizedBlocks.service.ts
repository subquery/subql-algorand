// Copyright 2020-2024 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import { Injectable } from '@nestjs/common';
import {
  BaseUnfinalizedBlocksService,
  Header,
  NodeConfig,
  StoreCacheService,
  mainThreadOnly,
} from '@subql/node-core';
import { AlgorandApiService, algorandBlockToHeader } from '../algorand';
import { BlockContent } from './types';

@Injectable()
export class UnfinalizedBlocksService extends BaseUnfinalizedBlocksService<BlockContent> {
  constructor(
    private readonly apiService: AlgorandApiService,
    nodeConfig: NodeConfig,
    storeCache: StoreCacheService,
  ) {
    super(nodeConfig, storeCache);
  }

  @mainThreadOnly()
  protected async getFinalizedHead(): Promise<Header> {
    const checkHealth = await this.apiService.api.api.makeHealthCheck().do();
    const latestHeight = checkHealth.round;
    return this.getHeaderForHeight(latestHeight);
  }

  @mainThreadOnly()
  protected async getHeaderForHash(hash: string): Promise<Header> {
    return this.getHeaderForHeight(parseInt(hash, 10));
  }

  @mainThreadOnly()
  protected async getHeaderForHeight(height: number): Promise<Header> {
    return algorandBlockToHeader(
      await this.apiService.api.getHeaderOnly(height),
    );
  }
}
