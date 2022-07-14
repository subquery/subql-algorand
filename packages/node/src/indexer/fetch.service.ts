// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { getHeapStatistics } from 'v8';
import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Interval } from '@nestjs/schedule';
import {
  isCustomDs,
  isRuntimeDs,
  AlgorandHandlerKind,
  AlgorandHandler,
  AlgorandDataSource,
  AlgorandRuntimeHandlerFilter,
  isRuntimeDataSourceV1_0_0,
} from '@subql/common-substrate';
import { DictionaryQueryEntry, AlgorandBlock } from '@subql/types';

import { Indexer } from 'algosdk';
import { isUndefined, range, sortBy, uniqBy } from 'lodash';
import { NodeConfig } from '../configure/NodeConfig';
import { SubqlProjectDs, SubqueryProject } from '../configure/SubqueryProject';
import * as AlgorandUtils from '../utils/algorand';
import { getLogger } from '../utils/logger';
import { profilerWrap } from '../utils/profiler';
import { isBaseHandler, isCustomHandler } from '../utils/project';
import { delay } from '../utils/promise';
import { getYargsOption } from '../yargs';
import { ApiService } from './api.service';
import { BlockedQueue } from './BlockedQueue';
import {
  Dictionary,
  DictionaryService,
  SpecVersion,
} from './dictionary.service';
import { DsProcessorService } from './ds-processor.service';
import { DynamicDsService } from './dynamic-ds.service';
import { IndexerEvent } from './events';

const logger = getLogger('fetch');
const BLOCK_TIME_VARIANCE = 5;
const DICTIONARY_MAX_QUERY_SIZE = 10000;
const CHECK_MEMORY_INTERVAL = 60000;
const HIGH_THRESHOLD = 0.85;
const LOW_THRESHOLD = 0.6;
const MINIMUM_BATCH_SIZE = 5;

const { argv } = getYargsOption();

const fetchBlocksBatches = argv.profiler
  ? profilerWrap(
      AlgorandUtils.fetchBlocksBatches,
      'AlgorandUtils',
      'fetchBlocksBatches',
    )
  : AlgorandUtils.fetchBlocksBatches;

function checkMemoryUsage(batchSize: number, batchSizeScale: number): number {
  const memoryData = getHeapStatistics();
  const ratio = memoryData.used_heap_size / memoryData.heap_size_limit;
  if (argv.profiler) {
    logger.info(`Heap Statistics: ${JSON.stringify(memoryData)}`);
    logger.info(`Heap Usage: ${ratio}`);
  }
  let scale = batchSizeScale;

  if (ratio > HIGH_THRESHOLD) {
    if (scale > 0) {
      scale = Math.max(scale - 0.1, 0);
      logger.debug(`Heap usage: ${ratio}, decreasing batch size by 10%`);
    }
  }

  if (ratio < LOW_THRESHOLD) {
    if (scale < 1) {
      scale = Math.min(scale + 0.1, 1);
      logger.debug(`Heap usage: ${ratio} increasing batch size by 10%`);
    }
  }
  return scale;
}

@Injectable()
export class FetchService implements OnApplicationShutdown {
  private latestFinalizedHeight: number;
  private latestProcessedHeight: number;
  private latestBufferedHeight: number;
  // changed this to block inteface
  private blockBuffer: BlockedQueue<AlgorandBlock>;
  private blockNumberBuffer: BlockedQueue<number>;
  private isShutdown = false;
  private useDictionary: boolean;
  private dictionaryQueryEntries?: DictionaryQueryEntry[];
  private batchSizeScale: number;
  private templateDynamicDatasouces: SubqlProjectDs[];

  constructor(
    private apiService: ApiService,
    private nodeConfig: NodeConfig,
    private project: SubqueryProject,
    private dictionaryService: DictionaryService,
    private dsProcessorService: DsProcessorService,
    private dynamicDsService: DynamicDsService,
    private eventEmitter: EventEmitter2,
  ) {
    this.blockBuffer = new BlockedQueue<AlgorandBlock>(
      this.nodeConfig.batchSize * 3,
    );
    this.blockNumberBuffer = new BlockedQueue<number>(
      this.nodeConfig.batchSize * 3,
    );
    this.batchSizeScale = 1;
  }

  onApplicationShutdown(): void {
    this.isShutdown = true;
  }

  get api(): Indexer {
    return this.apiService.getApi();
  }
  async syncDynamicDatascourcesFromMeta(): Promise<void> {
    this.templateDynamicDatasouces =
      await this.dynamicDsService.getDynamicDatasources();
  }
  getDictionaryQueryEntries(): DictionaryQueryEntry[] {
    const queryEntries: DictionaryQueryEntry[] = [];
    const dataSources = this.project.dataSources.filter((ds) =>
      isRuntimeDataSourceV1_0_0(ds),
    );

    for (const ds of dataSources.concat(this.templateDynamicDatasouces)) {
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

        filterList = filterList.filter((f) => f);

        if (!filterList.length) return [];
        switch (baseHandlerKind) {
          case AlgorandHandlerKind.Block:
            return [];
          case AlgorandHandlerKind.Transaction:
            filterList.forEach((f) => {
              const conditions = Object.entries(f).map(([field, value]) => ({
                field,
                value,
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

  register(next: (value: AlgorandBlock) => Promise<void>): () => void {
    let stopper = false;
    void (async () => {
      while (!stopper && !this.isShutdown) {
        const block = await this.blockBuffer.take();
        this.eventEmitter.emit(IndexerEvent.BlockQueueSize, {
          value: this.blockBuffer.size,
        });
        let success = false;
        while (!success) {
          try {
            await next(block);
            success = true;
          } catch (e) {
            logger.error(
              e,
              `failed to index block at height ${block.round} ${
                e.handler ? `${e.handler}(${e.handlerArgs ?? ''})` : ''
              }`,
            );
            process.exit(1);
          }
        }
      }
    })();
    return () => (stopper = true);
  }

  async init(): Promise<void> {
    await this.syncDynamicDatascourcesFromMeta();
    this.updateDictionary();

    this.eventEmitter.emit(IndexerEvent.UsingDictionary, {
      value: Number(this.useDictionary),
    });
    await this.getLatestRound();
  }

  @Interval(CHECK_MEMORY_INTERVAL)
  checkBatchScale() {
    if (argv['scale-batch-size']) {
      const scale = checkMemoryUsage(
        this.nodeConfig.batchSize,
        this.batchSizeScale,
      );

      if (this.batchSizeScale !== scale) {
        this.batchSizeScale = scale;
      }
    }
  }

  @Interval(BLOCK_TIME_VARIANCE * 1000)
  async getLatestRound() {
    if (!this.api) {
      logger.debug(`Skip fetch round until API is ready`);
      return;
    }
    try {
      const checkHealth = await this.api.makeHealthCheck().do();
      const currentRound = checkHealth.round;
      if (this.latestFinalizedHeight !== currentRound) {
        this.latestFinalizedHeight = currentRound;
        this.eventEmitter.emit(IndexerEvent.BlockTarget, {
          height: this.latestFinalizedHeight,
        });
      }
    } catch (e) {
      logger.error(e, `Having a problem when get finalized block`);
    }
  }

  latestProcessed(height: number): void {
    this.latestProcessedHeight = height;
  }

  async startLoop(initBlockHeight: number): Promise<void> {
    if (isUndefined(this.latestProcessedHeight)) {
      this.latestProcessedHeight = initBlockHeight - 1;
    }
    await Promise.all([
      this.fillNextBlockBuffer(initBlockHeight),
      this.fillBlockBuffer(),
    ]);
  }

  async fillNextBlockBuffer(initBlockHeight: number): Promise<void> {
    let startBlockHeight: number;
    let scaledBatchSize: number;

    while (!this.isShutdown) {
      startBlockHeight = this.latestBufferedHeight
        ? this.latestBufferedHeight + 1
        : initBlockHeight;

      scaledBatchSize = Math.max(
        Math.round(this.batchSizeScale * this.nodeConfig.batchSize),
        Math.min(MINIMUM_BATCH_SIZE, this.nodeConfig.batchSize * 3),
      );

      if (
        this.blockNumberBuffer.freeSize < scaledBatchSize ||
        startBlockHeight > this.latestFinalizedHeight
      ) {
        await delay(1);
        continue;
      }

      if (this.useDictionary) {
        const queryEndBlock = startBlockHeight + DICTIONARY_MAX_QUERY_SIZE;
        try {
          const dictionary = await this.dictionaryService.getDictionary(
            startBlockHeight,
            queryEndBlock,
            scaledBatchSize,
            this.dictionaryQueryEntries,
          );
          if (
            dictionary &&
            this.dictionaryValidation(dictionary, startBlockHeight)
          ) {
            const { batchBlocks } = dictionary;
            if (batchBlocks.length === 0) {
              this.setLatestBufferedHeight(
                Math.min(
                  queryEndBlock - 1,
                  dictionary._metadata.lastProcessedHeight,
                ),
              );
            } else {
              this.blockNumberBuffer.putAll(batchBlocks);
              this.setLatestBufferedHeight(batchBlocks[batchBlocks.length - 1]);
            }
            this.eventEmitter.emit(IndexerEvent.BlocknumberQueueSize, {
              value: this.blockNumberBuffer.size,
            });
            continue; // skip nextBlockRange() way
          }
          // else use this.nextBlockRange()
        } catch (e) {
          logger.debug(`Fetch dictionary stopped: ${e.message}`);
          this.eventEmitter.emit(IndexerEvent.SkipDictionary);
        }
      }
      // the original method: fill next batch size of blocks
      const endHeight = this.nextEndBlockHeight(
        startBlockHeight,
        scaledBatchSize,
      );
      this.blockNumberBuffer.putAll(range(startBlockHeight, endHeight + 1));
      this.setLatestBufferedHeight(endHeight);
    }
  }

  async fillBlockBuffer(): Promise<void> {
    while (!this.isShutdown) {
      const takeCount = Math.min(
        this.blockBuffer.freeSize,
        Math.round(this.batchSizeScale * this.nodeConfig.batchSize),
      );

      if (this.blockNumberBuffer.size === 0 || takeCount === 0) {
        await delay(1);
        continue;
      }

      const bufferBlocks = await this.blockNumberBuffer.takeAll(takeCount);
      const blocks = await fetchBlocksBatches(this.api, bufferBlocks);

      logger.info(
        `fetch block [${bufferBlocks[0]},${
          bufferBlocks[bufferBlocks.length - 1]
        }], total ${bufferBlocks.length} blocks`,
      );
      this.blockBuffer.putAll(blocks);
      this.eventEmitter.emit(IndexerEvent.BlockQueueSize, {
        value: this.blockBuffer.size,
      });
    }
  }

  getSpecFromMap(
    blockHeight: number,
    specVersions: SpecVersion[],
  ): number | undefined {
    //return undefined if can not find inside range
    const spec = specVersions.find(
      (spec) => blockHeight >= spec.start && blockHeight <= spec.end,
    );
    return spec ? Number(spec.id) : undefined;
  }

  private nextEndBlockHeight(
    startBlockHeight: number,
    scaledBatchSize: number,
  ): number {
    let endBlockHeight = startBlockHeight + scaledBatchSize - 1;

    if (endBlockHeight > this.latestFinalizedHeight) {
      endBlockHeight = this.latestFinalizedHeight;
    }
    return endBlockHeight;
  }

  async resetForNewDs(blockHeight: number): Promise<void> {
    await this.syncDynamicDatascourcesFromMeta();
    this.updateDictionary();
    this.blockBuffer.reset();
    this.blockNumberBuffer.reset();
    this.setLatestBufferedHeight(blockHeight);
  }

  updateDictionary() {
    this.dictionaryQueryEntries = this.getDictionaryQueryEntries();
    this.useDictionary =
      !!this.dictionaryQueryEntries?.length &&
      !!this.project.network.dictionary;
  }

  private dictionaryValidation(
    { _metadata: metaData }: Dictionary,
    startBlockHeight: number,
  ): boolean {
    if (metaData.genesisHash !== this.apiService.networkMeta.genesisHash) {
      logger.warn(`Dictionary is disabled since now`);
      this.useDictionary = false;
      this.eventEmitter.emit(IndexerEvent.UsingDictionary, {
        value: Number(this.useDictionary),
      });
      this.eventEmitter.emit(IndexerEvent.SkipDictionary);
      return false;
    }
    if (metaData.lastProcessedHeight < startBlockHeight) {
      logger.warn(
        `Dictionary indexed block is behind current indexing block height`,
      );
      this.eventEmitter.emit(IndexerEvent.SkipDictionary);
      return false;
    }
  }

  private setLatestBufferedHeight(height: number): void {
    this.latestBufferedHeight = height;
    this.eventEmitter.emit(IndexerEvent.BlocknumberQueueSize, {
      value: this.blockNumberBuffer.size,
    });
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
      throw new Error(`expect custom datasource here`);
    }
  }
}
