// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable } from '@nestjs/common';
import {
  getLogger,
  MmrService,
  NodeConfig,
  StoreService,
  ForceCleanService,
  BaseReindexService,
} from '@subql/node-core';
import { AlgorandDataSource } from '@subql/types-algorand';
import { Sequelize } from '@subql/x-sequelize';
import { SubqueryProject } from '../configure/SubqueryProject';
import { DynamicDsService } from '../indexer/dynamic-ds.service';
import { BlockContent } from '../indexer/types';
import { UnfinalizedBlocksService } from '../indexer/unfinalizedBlocks.service';

const logger = getLogger('Reindex');

@Injectable()
export class ReindexService extends BaseReindexService<
  SubqueryProject,
  AlgorandDataSource,
  BlockContent
> {
  constructor(
    sequelize: Sequelize,
    nodeConfig: NodeConfig,
    storeService: StoreService,
    mmrService: MmrService,
    @Inject('ISubqueryProject') project: SubqueryProject,
    forceCleanService: ForceCleanService,
    unfinalizedBlocksService: UnfinalizedBlocksService,
    dynamicDsService: DynamicDsService,
  ) {
    super(
      sequelize,
      nodeConfig,
      storeService,
      mmrService,
      project,
      forceCleanService,
      unfinalizedBlocksService,
      dynamicDsService,
    );
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  protected async getStartBlockDatasources(): Promise<AlgorandDataSource[]> {
    return this.project.dataSources;
  }
}
