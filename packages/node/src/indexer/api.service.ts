// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Injectable } from '@nestjs/common';
import { TokenHeader } from '@subql/common-algorand';
import {
  NetworkMetadataPayload,
  getLogger,
  delay,
  NodeConfig,
  profilerWrap,
} from '@subql/node-core';
import {
  AlgorandBlock,
  AlgorandTransaction,
  SafeAPI,
} from '@subql/types-algorand';
import algosdk, { Indexer } from 'algosdk';
import { SubqueryProject } from '../configure/SubqueryProject';
import * as AlgorandUtils from '../utils/algorand';

const logger = getLogger('api');

@Injectable()
export class ApiService {
  private api: Indexer;
  networkMeta: NetworkMetadataPayload;
  private blockCache: AlgorandBlock[];
  private fetchBlocksBatches = AlgorandUtils.fetchBlocksBatches;

  constructor(
    protected project: SubqueryProject,
    private nodeConfig: NodeConfig,
  ) {
    this.blockCache = [];
    if (this.nodeConfig.profiler) {
      this.fetchBlocksBatches = profilerWrap(
        AlgorandUtils.fetchBlocksBatches,
        'AlgorandUtil',
        'fetchBlocksBatches',
      );
    }
  }

  async init(): Promise<ApiService> {
    let token: string | TokenHeader;
    let baseServer: string;
    let genesisHash: string;
    let chain: string;
    const network = this.project.network;
    try {
      token = this.project.network.apiKey ?? '';
      const urlEndpoint = new URL(this.project.network.endpoint);
      baseServer = `${urlEndpoint.protocol}//${urlEndpoint.host}${urlEndpoint.pathname}`;
      this.api = new algosdk.Indexer(token, baseServer, urlEndpoint.port);
      // get genesisHash in block
      const block = await this.api.lookupBlock(1).do();
      genesisHash = block['genesis-hash'] ?? '';
      chain = block['genesis-id'] ?? '';
    } catch (e) {
      logger.error(e);
      process.exit(1);
    }

    this.networkMeta = {
      chain,
      genesisHash,
      specName: undefined,
    };

    if (network.chainId && network.chainId !== genesisHash) {
      const err = new Error(
        `Network chainId doesn't match expected genesisHash. expected="${
          network.chainId ?? network.genesisHash
        }" actual="${genesisHash}`,
      );
      logger.error(err, err.message);
      throw err;
    }

    return this;
  }

  getApi(): Indexer {
    return this.api;
  }

  getSafeApi(height: number): SafeAPI {
    return new SafeAPIService(this.api, height);
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

    const fetchedBlocks = await this.fetchBlocksBatches(
      this.getApi(),
      blockNums,
    );

    blocks = [...blocks, ...fetchedBlocks];

    blocks = await Promise.all(
      blocks.map(async (block) => {
        block.hash = await this.getBlockHash(block.round, blocks);
        return block;
      }),
    );

    return blocks;
  }

  private blockInCache(number): AlgorandBlock {
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
      const fetchedBlock = await AlgorandUtils.getBlockByHeight(
        this.getApi(),
        round + 1,
      );
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
  readonly indexer: Indexer;
  private readonly height;
  constructor(indexer: Indexer, height: number) {
    this.indexer = indexer;
    this.height = height;
  }
  async getBlock(): Promise<AlgorandBlock> {
    try {
      const block = await AlgorandUtils.getBlockByHeight(
        this.indexer,
        this.height,
      );
      if (!block.round) throw new Error();
      return block;
    } catch (error) {
      throw new Error('ERROR: failed to get block from safe api service.');
    }
  }
  async getTxns(): Promise<AlgorandTransaction[]> {
    try {
      const block = await AlgorandUtils.getBlockByHeight(
        this.indexer,
        this.height,
      );
      if (!block.transactions) throw new Error();
      return block.transactions;
    } catch (error) {
      throw new Error(
        'ERROR: failed to get transactions from safe api service.',
      );
    }
  }
}
