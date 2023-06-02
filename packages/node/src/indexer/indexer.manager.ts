// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable } from '@nestjs/common';
import {
  isRuntimeDs,
  AlgorandHandlerKind,
  isCustomDs,
  isBlockHandlerProcessor,
  isTransactionHandlerProcessor,
  AlgorandRuntimeHandlerInputMap,
} from '@subql/common-algorand';
import {
  NodeConfig,
  getLogger,
  profiler,
  IndexerSandbox,
  ProcessBlockResponse,
  BaseIndexerManager,
} from '@subql/node-core';
import {
  AlgorandBlock,
  AlgorandCustomDataSource,
  AlgorandCustomHandler,
  AlgorandDataSource,
  AlgorandTransaction,
  RuntimeHandlerInputMap,
  SafeAPI,
} from '@subql/types-algorand';
import {
  AlgorandApiService,
  SafeAPIService,
  filterBlock,
  filterTransaction,
} from '../algorand';
import { SubqlProjectDs } from '../configure/SubqueryProject';
import { yargsOptions } from '../yargs';
import {
  asSecondLayerHandlerProcessor_1_0_0,
  DsProcessorService,
} from './ds-processor.service';
import { DynamicDsService } from './dynamic-ds.service';
import { ProjectService } from './project.service';
import { SandboxService } from './sandbox.service';
import { BlockContent } from './types';
import { UnfinalizedBlocksService } from './unfinalizedBlocks.service';

const logger = getLogger('indexer');

@Injectable()
export class IndexerManager extends BaseIndexerManager<
  AlgorandApiService,
  SafeAPIService,
  BlockContent,
  AlgorandDataSource,
  AlgorandCustomDataSource,
  typeof FilterTypeMap,
  typeof ProcessorTypeMap,
  AlgorandRuntimeHandlerInputMap
> {
  constructor(
    apiService: AlgorandApiService,
    nodeConfig: NodeConfig,
    sandboxService: SandboxService<SafeAPI>,
    dsProcessorService: DsProcessorService,
    dynamicDsService: DynamicDsService,
    @Inject('IProjectService') private projectService: ProjectService,
    unfinalizedBlocksService: UnfinalizedBlocksService,
  ) {
    super(
      apiService,
      nodeConfig,
      sandboxService,
      dsProcessorService,
      dynamicDsService,
      unfinalizedBlocksService,
      FilterTypeMap,
      ProcessorTypeMap,
    );
  }

  protected isRuntimeDs = isRuntimeDs;
  protected isCustomDs = isCustomDs;
  protected updateCustomProcessor = asSecondLayerHandlerProcessor_1_0_0;

  @profiler()
  async indexBlock(
    block: BlockContent,
    dataSources: AlgorandDataSource[],
  ): Promise<ProcessBlockResponse> {
    return super.internalIndexBlock(block, dataSources, () =>
      this.getApi(block),
    );
  }

  async start(): Promise<void> {
    await this.projectService.init();
    logger.info('indexer manager started');
  }

  getBlockHeight(block: BlockContent): number {
    return block.round;
  }

  getBlockHash(block: BlockContent): string {
    return block.hash;
  }

  async getApi(block: BlockContent): Promise<SafeAPIService> {
    return Promise.resolve(
      this.apiService.api.getSafeApi(this.getBlockHeight(block)),
    );
  }

  protected async indexBlockData(
    block: BlockContent,
    dataSources: SubqlProjectDs[],
    getVM: (d: SubqlProjectDs) => Promise<IndexerSandbox>,
  ): Promise<void> {
    await this.indexBlockContent(block, dataSources, getVM);
    for (const tx of block.transactions) {
      await this.indexBlockTransactionContent(tx, dataSources, getVM);
    }
  }

  private async indexBlockContent(
    block: AlgorandBlock,
    dataSources: SubqlProjectDs[],
    getVM: (d: SubqlProjectDs) => Promise<IndexerSandbox>,
  ): Promise<void> {
    for (const ds of dataSources) {
      await this.indexData(AlgorandHandlerKind.Block, block, ds, getVM);
    }
  }

  private async indexBlockTransactionContent(
    txn: AlgorandTransaction,
    dataSources: SubqlProjectDs[],
    getVM: (d: SubqlProjectDs) => Promise<IndexerSandbox>,
  ): Promise<void> {
    for (const ds of dataSources) {
      await this.indexData(AlgorandHandlerKind.Transaction, txn, ds, getVM);
    }
  }

  protected async prepareFilteredData<T = any>(
    kind: AlgorandHandlerKind,
    data: T,
  ): Promise<T> {
    // Substrate doesn't need to do anything here
    return Promise.resolve(data);
  }

  protected baseCustomHandlerFilter(
    kind: AlgorandHandlerKind,
    data: any,
    baseFilter: any,
  ): boolean {
    switch (kind) {
      case AlgorandHandlerKind.Block:
        return filterBlock(data as AlgorandBlock, baseFilter);
      case AlgorandHandlerKind.Transaction:
        return filterTransaction(data as AlgorandTransaction, baseFilter);
      default:
        throw new Error('Unsupported handler kind');
    }
  }
}

type ProcessorTypeMap = {
  [AlgorandHandlerKind.Block]: typeof isBlockHandlerProcessor;
  [AlgorandHandlerKind.Transaction]: typeof isTransactionHandlerProcessor;
};
const ProcessorTypeMap = {
  [AlgorandHandlerKind.Block]: isBlockHandlerProcessor,
  [AlgorandHandlerKind.Transaction]: isTransactionHandlerProcessor,
};
const FilterTypeMap = {
  [AlgorandHandlerKind.Block]: filterBlock,
  [AlgorandHandlerKind.Transaction]: filterTransaction,
};
