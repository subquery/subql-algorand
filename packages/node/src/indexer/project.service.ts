// Copyright 2020-2024 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import { isMainThread } from 'worker_threads';
import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  PoiService,
  PoiSyncService,
  BaseProjectService,
  StoreService,
  NodeConfig,
  IProjectUpgradeService,
  profiler,
} from '@subql/node-core';
import { AlgorandDataSource } from '@subql/types-algorand';
import { Sequelize } from '@subql/x-sequelize';
import { AlgorandApiService } from '../algorand';
import { SubqueryProject } from '../configure/SubqueryProject';
import { DsProcessorService } from './ds-processor.service';
import { DynamicDsService } from './dynamic-ds.service';
import { UnfinalizedBlocksService } from './unfinalizedBlocks.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version: packageVersion } = require('../../package.json');

@Injectable()
export class ProjectService extends BaseProjectService<
  AlgorandApiService,
  AlgorandDataSource
> {
  protected packageVersion = packageVersion;

  constructor(
    dsProcessorService: DsProcessorService,
    apiService: AlgorandApiService,
    @Inject(isMainThread ? PoiService : 'Null') poiService: PoiService,
    @Inject(isMainThread ? PoiSyncService : 'Null')
    poiSyncService: PoiSyncService,
    @Inject(isMainThread ? Sequelize : 'Null') sequelize: Sequelize,
    @Inject('ISubqueryProject') project: SubqueryProject,
    @Inject('IProjectUpgradeService')
    projectUpgradeService: IProjectUpgradeService<SubqueryProject>,
    @Inject(isMainThread ? StoreService : 'Null') storeService: StoreService,
    nodeConfig: NodeConfig,
    dynamicDsService: DynamicDsService,
    eventEmitter: EventEmitter2,
    unfinalizedBlocksService: UnfinalizedBlocksService,
  ) {
    super(
      dsProcessorService,
      apiService,
      poiService,
      poiSyncService,
      sequelize,
      project,
      projectUpgradeService,
      storeService,
      nodeConfig,
      dynamicDsService,
      eventEmitter,
      unfinalizedBlocksService,
    );
  }

  @profiler()
  async init(startHeight?: number): Promise<void> {
    return super.init(startHeight);
  }

  protected async getBlockTimestamp(height: number): Promise<Date> {
    const block = await this.apiService.api.getBlockByHeight(height);

    return new Date(block.timestamp);
  }

  protected onProjectChange(project: SubqueryProject): void | Promise<void> {
    // TODO update this when implementing skipBlock feature for Eth
    // this.apiService.updateBlockFetching();
  }
}
