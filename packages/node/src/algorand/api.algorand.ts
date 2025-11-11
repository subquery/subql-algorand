// Copyright 2020-2025 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import assert from 'assert';
import { delay, getLogger, IBlock } from '@subql/node-core';
import {
  AlgorandBlock,
  AlgorandTransaction,
  SafeAPI,
} from '@subql/types-algorand';
import { IEndpointConfig } from '@subql/types-core';
import algosdk, { Indexer } from 'algosdk';
import { omit } from 'lodash';
import { camelCaseObjectKey, formatBlockUtil } from './utils.algorand';

const logger = getLogger('api.algorand');

export class AlgorandApi {
  private _genesisHash?: string;
  private _chain?: string;
  readonly api: Indexer;
  private blockCache: AlgorandBlock[] = [];
  private paginationLimit = 10000;

  private constructor(endpoint: string, config: IEndpointConfig) {
    this.api = new algosdk.Indexer(
      config.headers?.['X-Indexer-API-Token'] ?? '',
      endpoint,
      new URL(endpoint).port, // Specify the port, by default it will be an empty string, we don't want undefined because it then defaults to 8080
      config.headers,
    );
  }

  static async create(
    endpoint: string,
    config: IEndpointConfig,
  ): Promise<AlgorandApi> {
    const api = new AlgorandApi(endpoint, config);

    // get genesisHash in block
    const block = await api.api.lookupBlock(1).do();

    api._genesisHash = block['genesis-hash'] ?? '';
    api._chain = block['genesis-id'] ?? '';

    return api;
  }

  private get genesisHash(): string {
    assert(this._genesisHash, 'genesisHash not initialized');
    return this._genesisHash;
  }

  private get chain(): string {
    assert(this._chain, 'chain not initialized');
    return this._chain;
  }

  async getLatestBlockHeader(): Promise<AlgorandBlock> {
    const checkHealth = await this.api.makeHealthCheck().do();
    const block = await this.getHeaderOnly(checkHealth.round);

    return block;
  }

  async getBlockByHeight(height: number): Promise<AlgorandBlock> {
    try {
      const blockInfo = await this.api.lookupBlock(height).do();

      return this.constructBlock(camelCaseObjectKey(blockInfo));
    } catch (error: any) {
      if (error.message.includes('Max transactions limit exceeded')) {
        logger.warn('Max transactions limit exceeded, paginating transactions');

        return this.combinePaginateBlock(height);
      } else {
        logger.error(error, `failed to fetch Block at round ${height}`);
        throw error;
      }
    }
  }

  async getHeaderOnly(block: number): Promise<AlgorandBlock> {
    try {
      const result = await this.api.lookupBlock(block).headerOnly(true).do();
      return this.constructBlock(result as AlgorandBlock);
    } catch (e) {
      logger.error('Failed to fetch round header', e);
      throw e;
    }
  }

  async paginatedTransactions(
    blockHeight: number,
    nextToken?: string,
  ): Promise<AlgorandTransaction[]> {
    try {
      let req = this.api
        .searchForTransactions()
        .round(blockHeight)
        .limit(this.paginationLimit);

      if (nextToken) {
        req = req.nextToken(nextToken);
      }

      const result = await req.do();
      /*
      Maximum number of results to return. There could be additional pages even if the limit is not reached.
      https://developer.algorand.org/docs/rest-apis/indexer/#get-v2transactions

      Hence, the condition below
       */

      if (result.transactions.length > 0) {
        const nextPage = await this.paginatedTransactions(
          blockHeight,
          result['next-token'],
        );
        return result.transactions.concat(nextPage);
      }
      return result.transactions;
    } catch (e: any) {
      logger.error(e, 'Failed to paginated transactions');
      throw e;
    }
  }

  async combinePaginateBlock(blockHeight: number): Promise<AlgorandBlock> {
    try {
      const [blockHeader, paginatedTransactionsResults] = await Promise.all([
        this.getHeaderOnly(blockHeight),
        this.paginatedTransactions(blockHeight),
      ]);

      return this.constructBlock({
        ...camelCaseObjectKey(blockHeader),
        transactions: camelCaseObjectKey(paginatedTransactionsResults),
      });
    } catch (e) {
      logger.error(`Failed to paginate round ${blockHeight}`);
      throw e;
    }
  }

  private constructBlock(block: AlgorandBlock): AlgorandBlock {
    const newBlock = {
      ...block,
      getTransactionsByGroup: (groupId: string) =>
        transactions?.filter((tx) => tx.group === groupId) ?? [],
      toJSON() {
        return omit(this, ['getTransactionsByGroup', 'toJSON']);
      },
    };
    const transactions = newBlock.transactions?.map((tx) => ({
      ...tx,
      block: newBlock,
      toJSON() {
        return omit(this, ['block', 'toJSON']);
      },
    }));

    // Update transactions
    newBlock.transactions = transactions;

    return newBlock;
  }

  getGenesisHash(): string {
    return this.genesisHash;
  }

  getChainId(): string {
    return this.chain;
  }

  getSafeApi(height: number): SafeAPIService {
    return new SafeAPIService(this, height);
  }
  async fetchBlocks(blockNums: number[]): Promise<IBlock<AlgorandBlock>[]> {
    const blocks = await Promise.all(
      blockNums.map(
        (num) => this.blockInCache(num) ?? this.getBlockByHeight(num),
      ),
    );

    const formattedBlocks = await Promise.all(
      blocks.map(async (block) => {
        block.hash = await this.getBlockHash(block.round, blocks);
        return formatBlockUtil(block);
      }),
    );

    return formattedBlocks;
  }

  private blockInCache(number: number): AlgorandBlock | undefined {
    for (let i = 0; i < this.blockCache.length; i++) {
      if (this.blockCache[i].round === number) {
        const block = this.blockCache[i];
        //remove block cache once used
        this.blockCache.splice(i, 1);
        return block;
      }
    }
    return undefined;
  }

  private async getBlockHash(
    round: number,
    blocks: AlgorandBlock[],
  ): Promise<string> {
    for (const block of blocks) {
      if (block.round === round + 1) {
        return block.previousBlockHash;
      }
    }

    try {
      const fetchedBlock = await this.getBlockByHeight(round + 1);
      this.blockCache.push(fetchedBlock);

      return fetchedBlock.previousBlockHash;
    } catch (e) {
      let checkHealth = await this.api.makeHealthCheck().do();
      let currentRound = checkHealth.round;
      if (currentRound >= round + 1) {
        throw e;
      }
      while (currentRound < round + 1) {
        await delay(1); // eslint-disable-line @typescript-eslint/await-thenable
        checkHealth = await this.api.makeHealthCheck().do(); // eslint-disable-line @typescript-eslint/await-thenable
        currentRound = checkHealth.round;
      }
    }
    throw new Error(`Unable to get block hash for round ${round}`);
  }
}

export class SafeAPIService implements SafeAPI {
  readonly indexer: Indexer;
  constructor(private api: AlgorandApi, private readonly height: number) {
    this.indexer = api.api;
  }
  async getBlock(): Promise<AlgorandBlock> {
    try {
      const block = await this.api.getBlockByHeight(this.height);
      if (!block.round) throw new Error();
      return block;
    } catch (error) {
      throw new Error('ERROR: failed to get block from safe api service.');
    }
  }
  async getTxns(): Promise<AlgorandTransaction[]> {
    try {
      const block = await this.api.getBlockByHeight(this.height);
      if (!block.transactions) throw new Error();
      return block.transactions;
    } catch (error) {
      throw new Error(
        'ERROR: failed to get transactions from safe api service.',
      );
    }
  }
}
