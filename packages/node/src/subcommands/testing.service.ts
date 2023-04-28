// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable } from '@nestjs/common';
import {
  NodeConfig,
  StoreService,
  TestingService as BaseTestingService,
} from '@subql/node-core';
import { Sequelize } from 'sequelize';
import { AlgorandApiService } from '../algorand';
import { SubqlProjectDs, SubqueryProject } from '../configure/SubqueryProject';
import { IndexerManager } from '../indexer/indexer.manager';
import { BlockContent } from '../indexer/types';

@Injectable()
export class TestingService extends BaseTestingService<
  BlockContent,
  SubqlProjectDs
> {
  constructor(
    sequelize: Sequelize,
    nodeConfig: NodeConfig,
    storeService: StoreService,
    @Inject('ISubqueryProject') project: SubqueryProject,
    apiService: AlgorandApiService,
    indexerManager: IndexerManager,
  ) {
    super(
      sequelize,
      nodeConfig,
      storeService,
      project,
      apiService,
      indexerManager,
    );
  }

  async indexBlock(block: BlockContent, handler: string): Promise<void> {
    await this.indexerManager.indexBlock(block, this.getDsWithHandler(handler));
  }
}
