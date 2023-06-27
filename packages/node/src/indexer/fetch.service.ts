// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Interval, SchedulerRegistry } from '@nestjs/schedule';

import {
  isCustomDs,
  isRuntimeDs,
  AlgorandHandlerKind,
  AlgorandHandler,
  AlgorandDataSource,
  AlgorandRuntimeHandlerFilter,
  isRuntimeDataSourceV1_0_0,
} from '@subql/common-algorand';
import { NodeConfig, BaseFetchService } from '@subql/node-core';
import { DictionaryQueryCondition } from '@subql/types';
import {
  AlgorandBlockFilter,
  DictionaryQueryEntry,
} from '@subql/types-algorand';
import { MetaData } from '@subql/utils';
import { Indexer } from 'algosdk';
import { range, sortBy, uniqBy, without } from 'lodash';
import { AlgorandApi, AlgorandApiService, calcInterval } from '../algorand';
import { SubqlProjectDs, SubqueryProject } from '../configure/SubqueryProject';
import { isBaseHandler, isCustomHandler } from '../utils/project';
import { IAlgorandBlockDispatcher } from './blockDispatcher';
import { DictionaryService } from './dictionary.service';
import { DsProcessorService } from './ds-processor.service';
import { DynamicDsService } from './dynamic-ds.service';

const BLOCK_TIME_VARIANCE = 5000; //ms
const DICTIONARY_MAX_QUERY_SIZE = 10000;
const CHECK_MEMORY_INTERVAL = 60000;
const MINIMUM_BATCH_SIZE = 5;

const INTERVAL_PERCENT = 0.9;

@Injectable()
export class FetchService extends BaseFetchService<
  AlgorandApiService,
  AlgorandDataSource,
  IAlgorandBlockDispatcher,
  DictionaryService
> {
  constructor(
    apiService: AlgorandApiService,
    nodeConfig: NodeConfig,
    @Inject('ISubqueryProject') project: SubqueryProject,
    @Inject('IBlockDispatcher')
    blockDispatcher: IAlgorandBlockDispatcher,
    dictionaryService: DictionaryService,
    dsProcessorService: DsProcessorService,
    dynamicDsService: DynamicDsService,
    eventEmitter: EventEmitter2,
    schedulerRegistry: SchedulerRegistry,
  ) {
    super(
      apiService,
      nodeConfig,
      project,
      blockDispatcher,
      dictionaryService,
      dsProcessorService,
      dynamicDsService,
      eventEmitter,
      schedulerRegistry,
    );
  }

  get api(): AlgorandApi {
    return this.apiService.unsafeApi;
  }

  buildDictionaryQueryEntries(startBlock: number): DictionaryQueryEntry[] {
    const queryEntries: DictionaryQueryEntry[] = [];
    const dataSources = this.project.dataSources.filter((ds) =>
      isRuntimeDataSourceV1_0_0(ds),
    );

    // Only run the ds that is equal or less than startBlock
    // sort array from lowest ds.startBlock to highest
    const filteredDs = dataSources
      .concat(this.templateDynamicDatasouces)
      .filter((ds) => ds.startBlock <= startBlock)
      .sort((a, b) => a.startBlock - b.startBlock);

    for (const ds of filteredDs) {
      const plugin = isCustomDs(ds)
        ? this.dsProcessorService.getDsProcessor(ds)
        : undefined;
      for (const handler of ds.mapping.handlers) {
        const baseHandlerKind = this.getBaseHandlerKind(ds, handler);
        let filterList: AlgorandRuntimeHandlerFilter[];
        if (isCustomDs(ds)) {
          //const processor = plugin.handlerProcessors[handler.kind];
          filterList = this.getBaseHandlerFilters<AlgorandRuntimeHandlerFilter>(
            ds,
            handler.kind,
          );
        } else {
          filterList = [handler.filter];
        }
        // Filter out any undefined
        filterList = filterList.filter(Boolean);
        if (!filterList.length) return [];
        switch (baseHandlerKind) {
          case AlgorandHandlerKind.Block:
            for (const filter of filterList as AlgorandBlockFilter[]) {
              if (filter.modulo === undefined) {
                return [];
              }
            }
            break;
          case AlgorandHandlerKind.Transaction:
            filterList.forEach((f) => {
              const conditions: DictionaryQueryCondition[] = Object.entries(
                f,
              ).map(([field, value]) => ({
                field,
                value,
                matcher: 'equalTo',
              }));
              queryEntries.push({
                entity: 'transactions',
                conditions,
              });
            });
            break;
          default:
        }
      }
    }

    return uniqBy(
      queryEntries,
      (item) =>
        `${item.entity}|${JSON.stringify(
          sortBy(item.conditions, (c) => c.field),
        )}`,
    );
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

  getModulos(): number[] {
    const modulos: number[] = [];
    for (const ds of this.project.dataSources) {
      if (isCustomDs(ds)) {
        continue;
      }
      for (const handler of ds.mapping.handlers) {
        if (
          handler.kind === AlgorandHandlerKind.Block &&
          handler.filter &&
          handler.filter.modulo
        ) {
          modulos.push(handler.filter.modulo);
        }
      }
    }
    return modulos;
  }

  private getBaseHandlerKind(
    ds: AlgorandDataSource,
    handler: AlgorandHandler,
  ): AlgorandHandlerKind {
    if (isRuntimeDs(ds) && isBaseHandler(handler)) {
      return handler.kind;
    } else if (isCustomDs(ds) && isCustomHandler(handler)) {
      const plugin = this.dsProcessorService.getDsProcessor(ds);
      const baseHandler =
        plugin.handlerProcessors[handler.kind]?.baseHandlerKind;
      if (!baseHandler) {
        throw new Error(
          `handler type ${handler.kind} not found in processor for ${ds.kind}`,
        );
      }
      return baseHandler;
    } else {
      throw new Error('unknown base handler kind');
    }
  }

  protected async preLoopHook(): Promise<void> {
    // Algorand doesn't need to do anything here
    return Promise.resolve();
  }

  private getBaseHandlerFilters<T extends AlgorandRuntimeHandlerFilter>(
    ds: AlgorandDataSource,
    handlerKind: string,
  ): T[] {
    if (isCustomDs(ds)) {
      const plugin = this.dsProcessorService.getDsProcessor(ds);
      const processor = plugin.handlerProcessors[handlerKind];
      return processor.baseFilter instanceof Array
        ? (processor.baseFilter as T[])
        : ([processor.baseFilter] as T[]);
    } else {
      throw new Error(`Expected a custom datasource here`);
    }
  }
}
