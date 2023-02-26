// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TokenHeader } from '@subql/common-algorand';
import { getLogger } from '@subql/node-core';
import { AlgorandBlock } from '@subql/types-algorand';
import algosdk, { Indexer } from 'algosdk';
import axios from 'axios';
import { camelCaseObjectKey } from './utils.algorand';

const logger = getLogger('api.algorand');

export class AlgorandApi {
  private genesisHash: string;
  private chain: string;
  private api: Indexer;

  constructor(private endpoint: string, private token?: string | TokenHeader) {
    // let token: string | TokenHeader;
    // let baseServer: string;
    // let genesisHash: string;
    // let chain: string;

    this.token = this.token ?? '';
    const urlEndpoint = new URL(endpoint);
    const baseServer = `${urlEndpoint.protocol}//${urlEndpoint.host}${urlEndpoint.pathname}`;
    this.api = new algosdk.Indexer(token, baseServer, urlEndpoint.port);

    // get genesisHash in block
    // const block = await this.api.lookupBlock(1).do();
  }

  async init(): Promise<void> {
    // get genesisHash in block
    const block = await this.api.lookupBlock(1).do();

    this.genesisHash = block['genesis-hash'] ?? '';
    this.chain = block['genesis-id'] ?? '';
  }

  async getBlockByHeight(
    // api: Indexer,
    height: number,
    // endpoint: string,
  ): Promise<AlgorandBlock> {
    try {
      const blockInfo = await this.api.lookupBlock(height).do();
      return camelCaseObjectKey(blockInfo);
    } catch (error) {
      if (error.message.includes('Max transactions limit exceeded')) {
        logger.warn('Max transactions limit exceeded, paging transactions');

        const header = camelCaseObjectKey(await this.getHeaderOnly(height));
        console.log('header: ', header);
        return this.combinePaginateBlock(height, this.endpoint);
      }
      logger.error(`failed to fetch Block at round ${height}`);
      throw error;
    }
  }

  async getHeaderOnly(block: number): Promise<any> {
    try {
      // const testNetEndpoint = 'https://algoindexer.testnet.algoexplorerapi.io';
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
      console.log('header-only: ', result);
      return result;
    } catch (e) {
      console.error(e.message);
      throw e;
    }
  }

  async paginatedTransactions(
    blockHeight: number,
    endpoint: string,
    nextToken?: string,
  ): Promise<any> {
    const pageLimit = 10000;
    try {
      // const testNetEndpoint = 'https://algoindexer.testnet.algoexplorerapi.io';
      const result: { transactions: any[] } = (
        await axios({
          params: {
            round: blockHeight,
            limit: pageLimit,
            next: nextToken,
          },
          method: 'get',
          url: `/v2/transactions`,
          baseURL: endpoint,
        })
      ).data;
      // greater or equal
      if (result.transactions.length > 0) {
        const savedResult = result;
        // console.log('pagination: ', result)

        return (
          await this.paginatedTransactions(
            blockHeight,
            endpoint,
            savedResult['next-token'],
          )
        ).concat(savedResult);
      }
      return result;
    } catch (e) {
      logger.error('Failed to paginate, oh no', e);
      throw e;
    }
  }

  async combinePaginateBlock(
    blockHeight: number,
    endpoint: string,
  ): Promise<AlgorandBlock> {
    try {
      const [blockHeader, paginatedTransactionsResults] = await Promise.all([
        this.getHeaderOnly(blockHeight),
        this.paginatedTransactions(blockHeight, endpoint),
      ]);
      const header = camelCaseObjectKey(blockHeader);
      header.transactions = camelCaseObjectKey(paginatedTransactionsResults);
      return header;
    } catch (e) {
      logger.error('Failed to paginate');
      throw e;
    }
  }

  async fetchBlocksArray(
    // api: Indexer,
    blockArray: number[],
    // endpoint: string,
  ): Promise<any[]> {
    return Promise.all(
      blockArray.map(async (height) => this.getBlockByHeight(height)),
    );
  }
  async fetchBlocksBatches(
    // api: Indexer,
    blockArray: number[],
    // endpoint: string,
  ): Promise<AlgorandBlock[]> {
    return this.fetchBlocksArray(blockArray);
  }
}
