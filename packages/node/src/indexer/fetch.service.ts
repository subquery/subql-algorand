// Copyright 2020-2024 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  isCustomDs,
  AlgorandHandlerKind,
  AlgorandDataSource,
} from '@subql/common-algorand';
import { NodeConfig, BaseFetchService, getModulos } from '@subql/node-core';
import { AlgorandBlock } from '@subql/types-algorand';
import { AlgorandApi, AlgorandApiService, calcInterval } from '../algorand';
import { SubqueryProject } from '../configure/SubqueryProject';
import { IAlgorandBlockDispatcher } from './blockDispatcher';
import { AlgorandDictionaryService } from './dictionary';
import { ProjectService } from './project.service';

const BLOCK_TIME_VARIANCE = 5000; //ms

const INTERVAL_PERCENT = 0.9;

@Injectable()
export class FetchService extends BaseFetchService<
  AlgorandDataSource,
  IAlgorandBlockDispatcher,
  AlgorandBlock
> {
  constructor(
    private apiService: AlgorandApiService,
    nodeConfig: NodeConfig,
    @Inject('IProjectService') projectService: ProjectService,
    @Inject('ISubqueryProject') project: SubqueryProject,
    @Inject('IBlockDispatcher')
    blockDispatcher: IAlgorandBlockDispatcher,
    dictionaryService: AlgorandDictionaryService,
    eventEmitter: EventEmitter2,
    schedulerRegistry: SchedulerRegistry,
  ) {
    super(
      nodeConfig,
      projectService,
      project.network,
      blockDispatcher,
      dictionaryService,
      eventEmitter,
      schedulerRegistry,
    );
  }

  get api(): AlgorandApi {
    return this.apiService.unsafeApi;
  }

  protected getGenesisHash(): string {
    return this.apiService.networkMeta.genesisHash;
  }

  protected async getFinalizedHeight(): Promise<number> {
    const checkHealth = await this.api.api.makeHealthCheck().do();
    return checkHealth.round;
  }

  protected async getBestHeight(): Promise<number> {
    return this.getFinalizedHeight();
  }

  protected async getChainId(): Promise<string> {
    return Promise.resolve(this.api.getGenesisHash());
  }

  protected async initBlockDispatcher(): Promise<void> {
    await this.blockDispatcher.init(this.resetForNewDs.bind(this));
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  protected async getChainInterval(): Promise<number> {
    const chainInterval = calcInterval(this.api.api) * INTERVAL_PERCENT;
    return Math.min(BLOCK_TIME_VARIANCE, chainInterval);
  }

  protected getModulos(dataSources: AlgorandDataSource[]): number[] {
    return getModulos(dataSources, isCustomDs, AlgorandHandlerKind.Block);
  }
  protected async preLoopHook(): Promise<void> {
    // Algorand doesn't need to do anything here
    return Promise.resolve();
  }
}
