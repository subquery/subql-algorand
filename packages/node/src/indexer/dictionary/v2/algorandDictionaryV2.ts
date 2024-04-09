// Copyright 2020-2024 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import {
  NodeConfig,
  DictionaryV2,
  DictionaryResponse,
  DictionaryV2QueryEntry,
  RawDictionaryResponseData,
  IBlock,
} from '@subql/node-core';
import { AlgorandBlock, AlgorandDataSource } from '@subql/types-algorand';
import { SubqueryProject } from '../../../configure/SubqueryProject';
import { AlgorandDictionaryV2QueryEntry } from './types';

const MIN_FETCH_LIMIT = 200;

export function buildDictionaryV2QueryEntry(
  dataSources: AlgorandDataSource[],
): AlgorandDictionaryV2QueryEntry {
  const dictionaryConditions: AlgorandDictionaryV2QueryEntry = {
    logs: [],
    transactions: [],
  };
  //TODO
  return dictionaryConditions;
}

export class AlgorandDictionaryV2 extends DictionaryV2<
  AlgorandBlock,
  AlgorandDataSource,
  AlgorandDictionaryV2QueryEntry
> {
  protected buildDictionaryQueryEntries(
    dataSources: AlgorandDataSource[],
  ): DictionaryV2QueryEntry {
    return buildDictionaryV2QueryEntry(dataSources);
  }

  constructor(
    endpoint: string,
    nodeConfig: NodeConfig,
    project: SubqueryProject,
    chainId?: string,
  ) {
    super(endpoint, chainId ?? project.network.chainId, nodeConfig);
  }

  static async create(
    endpoint: string,
    nodeConfig: NodeConfig,
    project: SubqueryProject,
    chainId?: string,
  ): Promise<AlgorandDictionaryV2> {
    const dictionary = new AlgorandDictionaryV2(
      endpoint,
      nodeConfig,
      project,
      chainId,
    );
    await dictionary.init();
    return dictionary;
  }

  /**
   *
   * @param startBlock
   * @param queryEndBlock this block number will limit the max query range, increase dictionary query speed
   * @param batchSize
   * @param conditions
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async getData(
    startBlock: number,
    queryEndBlock: number,
    limit = MIN_FETCH_LIMIT,
  ): Promise<DictionaryResponse<IBlock<AlgorandBlock> | number> | undefined> {
    return this.getData(startBlock, queryEndBlock, limit);
  }

  // TODO, complete this once algorand support v2
  convertResponseBlocks(
    result: RawDictionaryResponseData<any>,
  ): DictionaryResponse<IBlock<AlgorandBlock>> | undefined {
    return undefined;
  }
}
