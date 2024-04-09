// Copyright 2020-2023 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import { Injectable } from '@nestjs/common';
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
  profiler,
  IndexerSandbox,
  ProcessBlockResponse,
  BaseIndexerManager,
  IBlock,
} from '@subql/node-core';
import {
  AlgorandBlock,
  AlgorandCustomDataSource,
  AlgorandDataSource,
  AlgorandTransaction,
  SafeAPI,
} from '@subql/types-algorand';
import {
  AlgorandApi,
  AlgorandApiService,
  SafeAPIService,
  filterBlock,
  filterTransaction,
} from '../algorand';
import { AlgorandProjectDs } from '../configure/SubqueryProject';
import {
  asSecondLayerHandlerProcessor_1_0_0,
  DsProcessorService,
} from './ds-processor.service';
import { DynamicDsService } from './dynamic-ds.service';
import { SandboxService } from './sandbox.service';
import { BlockContent } from './types';
import { UnfinalizedBlocksService } from './unfinalizedBlocks.service';

@Injectable()
export class IndexerManager extends BaseIndexerManager<
  SafeAPIService,
  AlgorandApi,
  BlockContent,
  AlgorandApiService,
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
    block: IBlock<BlockContent>,
    dataSources: AlgorandDataSource[],
  ): Promise<ProcessBlockResponse> {
    return super.internalIndexBlock(block, dataSources, () =>
      this.getApi(block.block),
    );
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
    dataSources: AlgorandProjectDs[],
    getVM: (d: AlgorandProjectDs) => Promise<IndexerSandbox>,
  ): Promise<void> {
    await this.indexBlockContent(block, dataSources, getVM);
    for (const tx of block.transactions) {
      await this.indexBlockTransactionContent(tx, dataSources, getVM);
    }
  }

  private async indexBlockContent(
    block: AlgorandBlock,
    dataSources: AlgorandProjectDs[],
    getVM: (d: AlgorandProjectDs) => Promise<IndexerSandbox>,
  ): Promise<void> {
    for (const ds of dataSources) {
      await this.indexData(AlgorandHandlerKind.Block, block, ds, getVM);
    }
  }

  private async indexBlockTransactionContent(
    txn: AlgorandTransaction,
    dataSources: AlgorandProjectDs[],
    getVM: (d: AlgorandProjectDs) => Promise<IndexerSandbox>,
  ): Promise<void> {
    for (const ds of dataSources) {
      await this.indexData(AlgorandHandlerKind.Transaction, txn, ds, getVM);
    }
  }

  protected async prepareFilteredData<T = any>(
    kind: AlgorandHandlerKind,
    data: T,
  ): Promise<T> {
    // Algorand doesn't need to do anything here
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
