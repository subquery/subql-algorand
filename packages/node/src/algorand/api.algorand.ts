// Copyright 2020-2024 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import { TokenHeader } from '@subql/common-algorand';
import { delay, getLogger, IBlock } from '@subql/node-core';
import {
  AlgorandBlock,
  AlgorandTransaction,
  SafeAPI,
} from '@subql/types-algorand';
import algosdk, { Indexer } from 'algosdk';
import axios from 'axios';
import { omit } from 'lodash';
import { camelCaseObjectKey, formatBlockUtil } from './utils.algorand';

const logger = getLogger('api.algorand');

export class AlgorandApi {
  private genesisHash: string;
  private chain: string;
  api: Indexer;
  private blockCache: AlgorandBlock[];
  private paginationLimit = 10000;

  constructor(private endpoint: string, private token?: string | TokenHeader) {
    this.token = token ?? '';
    this.blockCache = [];
  }

  async init(): Promise<void> {
    // get genesisHash in block
    const urlEndpoint = new URL(this.endpoint);
    const baseServer = `${urlEndpoint.protocol}//${urlEndpoint.host}${urlEndpoint.pathname}`;

    this.api = new algosdk.Indexer(this.token, baseServer, urlEndpoint.port);

    const block = await this.api.lookupBlock(1).do();

    this.genesisHash = block['genesis-hash'] ?? '';
    this.chain = block['genesis-id'] ?? '';
  }

  async getBlockByHeight(height: number): Promise<AlgorandBlock> {
    try {
      const blockInfo = await this.api.lookupBlock(height).do();
      return this.constructBlock(camelCaseObjectKey(blockInfo));
    } catch (error) {
      if (error.message.includes('Max transactions limit exceeded')) {
        logger.warn('Max transactions limit exceeded, paginating transactions');

        return this.combinePaginateBlock(height);
      } else {
        logger.error(`failed to fetch Block at round ${height}`);
        throw error;
      }
    }
  }

  async getHeaderOnly(block: number): Promise<AlgorandBlock> {
    try {
      const result = (
        await axios({
          params: {
            'header-only': true,
          },
          method: 'get',
          url: `/v2/blocks/${block}`,
          baseURL: this.endpoint,
        })
      ).data;
      return result;
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
      const result: { transactions: AlgorandTransaction[] } = (
        await axios({
          params: {
            round: blockHeight,
            limit: this.paginationLimit,
            next: nextToken && nextToken,
          },
          method: 'get',
          url: `/v2/transactions`,
          baseURL: this.endpoint,
        })
      ).data;
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
    } catch (e) {
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
        transactions.filter((tx) => tx.group === groupId),
      toJSON() {
        return omit(this, ['getTransactionsByGroup', 'toJSON']);
      },
    };
    const transactions = newBlock.transactions.map((tx) => ({
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

  async fetchBlocksArray(blockArray: number[]): Promise<any[]> {
    return Promise.all(
      blockArray.map(async (height) => this.getBlockByHeight(height)),
    );
  }
  async fetchBlocksBatches(blockArray: number[]): Promise<AlgorandBlock[]> {
    return this.fetchBlocksArray(blockArray);
  }

  getGenesisHash(): string {
    return this.genesisHash;
  }

  getChainId(): string {
    return this.chain;
  }

  getSafeApi(height: number): SafeAPIService {
    return new SafeAPIService(this, height, this.endpoint);
  }
  async fetchBlocks(blockNums: number[]): Promise<IBlock<AlgorandBlock>[]> {
    let blocks: AlgorandBlock[] = [];

    for (let i = 0; i < blockNums.length; i++) {
      const cached = this.blockInCache(blockNums[i]);
      if (cached) {
        blocks.push(cached);
        blockNums.splice(i, 1);
      }
    }

    const fetchedBlocks = await this.fetchBlocksBatches(blockNums);

    blocks = [...blocks, ...fetchedBlocks];

    const formattedBlocks = await Promise.all(
      blocks.map(async (block) => {
        block.hash = await this.getBlockHash(block.round, blocks);
        return formatBlockUtil(block);
      }),
    );

    return formattedBlocks;
  }

  private blockInCache(number: number): AlgorandBlock {
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
  }
}

export class SafeAPIService implements SafeAPI {
  readonly indexer: Indexer;
  private readonly height;
  private readonly endpoint;
  constructor(private api: AlgorandApi, height: number, endpoint: string) {
    this.height = height;
    this.endpoint = endpoint;
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
