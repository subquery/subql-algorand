// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TokenHeader } from '@subql/common-algorand';
import { delay, getLogger } from '@subql/node-core';
import { AlgorandBlock, AlgorandTransaction } from '@subql/types-algorand';
import algosdk, { Indexer } from 'algosdk';
import axios from 'axios';
import { camelCaseObjectKey } from './utils.algorand';

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

    try {
      const block = await this.api.lookupBlock(1).do();

      this.genesisHash = block['genesis-hash'] ?? '';
      this.chain = block['genesis-id'] ?? '';
    } catch (e) {
      logger.error(e);
      process.exit(1);
    }
  }

  async getBlockByHeight(height: number): Promise<AlgorandBlock> {
    try {
      const blockInfo = await this.api.lookupBlock(height).do();
      return camelCaseObjectKey(blockInfo);
    } catch (error) {
      if (error.message.includes('Max transactions limit exceeded')) {
        logger.warn('Max transactions limit exceeded, paging transactions');

        // const header = camelCaseObjectKey(await this.getHeaderOnly(height));
        // console.log('header: ', header);
        return this.combinePaginateBlock(height);
      }
      logger.error(`failed to fetch Block at round ${height}`);
      throw error;
    }
  }

  async getHeaderOnly(block: number): Promise<any> {
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
      // console.log('header-only: ', result);
      return result;
    } catch (e) {
      logger.error('Failed to fetch round header', e);
      throw e;
    }
  }

  async paginatedTransactions(
    blockHeight: number,
    combinedTx: any[] = [],
    nextToken?: string,
  ): Promise<any> {
    try {
      const result: { transactions: any[] } = (
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
      if (result.transactions.length > 0) {
        combinedTx.push(result.transactions);

        return await this.paginatedTransactions(
          blockHeight,
          combinedTx,
          result['next-token'],
        );
      }
      return [].concat(...combinedTx);
    } catch (e) {
      logger.error('Failed to paginate, oh no', e);
      throw e;
    }
  }

  async combinePaginateBlock(blockHeight: number): Promise<AlgorandBlock> {
    try {
      const [blockHeader, paginatedTransactionsResults] = await Promise.all([
        this.getHeaderOnly(blockHeight),
        this.paginatedTransactions(blockHeight),
      ]);
      const header = camelCaseObjectKey(blockHeader);
      header.transactions = camelCaseObjectKey(paginatedTransactionsResults);
      return header;
    } catch (e) {
      logger.error('Failed to paginate');
      throw e;
    }
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
    return new SafeAPIService(height, this.endpoint);
  }
  async fetchBlocks(blockNums: number[]): Promise<AlgorandBlock[]> {
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

    blocks = await Promise.all(
      blocks.map(async (block) => {
        block.hash = await this.getBlockHash(block.round, blocks);
        return block;
      }),
    );

    return blocks;
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

export class SafeAPIService {
  private _api: AlgorandApi;
  private readonly height;
  private readonly endpoint;
  constructor(height: number, endpoint: string) {
    this.api = new AlgorandApi(endpoint);
    this.height = height;
    this.endpoint = endpoint;
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

  get api(): AlgorandApi {
    return this._api;
  }

  private set api(value: AlgorandApi) {
    this._api = value;
  }
}
