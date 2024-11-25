// Copyright 2020-2024 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ApiService,
  ConnectionPoolService,
  getLogger,
  IBlock,
  MetadataMismatchError,
  exitWithError,
} from '@subql/node-core';
import { ProjectNetworkConfig } from '@subql/types-core';
import { SubqueryProject } from '../configure/SubqueryProject';
import { BlockContent } from '../indexer/types';
import { AlgorandApi, SafeAPIService } from './api.algorand';
import { AlgorandApiConnection } from './api.connection';

const logger = getLogger('api');

@Injectable()
export class AlgorandApiService extends ApiService<
  AlgorandApi,
  SafeAPIService,
  IBlock<BlockContent>[]
> {
  constructor(
    @Inject('ISubqueryProject') private project: SubqueryProject,
    connectionPoolService: ConnectionPoolService<AlgorandApiConnection>,
    eventEmitter: EventEmitter2,
  ) {
    super(connectionPoolService, eventEmitter);
  }

  static async init(
    project: SubqueryProject,
    connectionPoolService: ConnectionPoolService<AlgorandApiConnection>,
    eventEmitter: EventEmitter2,
  ): Promise<AlgorandApiService> {
    const apiService = new AlgorandApiService(
      project,
      connectionPoolService,
      eventEmitter,
    );
    try {
      await apiService.createConnections(
        apiService.project.network,
        (endpoint, config) =>
          AlgorandApiConnection.create(
            endpoint,
            config,
            apiService.fetchBlockBatches,
          ),
      );
    } catch (e) {
      exitWithError(new Error(`Failed to init api`, { cause: e }), logger);
    }

    return apiService;
  }

  get api(): AlgorandApi {
    return this.unsafeApi;
  }

  async fetchBlockBatches(
    api: AlgorandApi,
    blocks: number[],
  ): Promise<IBlock<BlockContent>[]> {
    return api.fetchBlocks(blocks);
  }

  protected assertChainId(
    network: ProjectNetworkConfig & { chainId: string },
    connection: AlgorandApiConnection,
  ): void {
    if (network.chainId !== connection.networkMeta.genesisHash) {
      throw new MetadataMismatchError(
        'ChainId',
        network.chainId,
        connection.networkMeta.genesisHash,
      );
    }
  }
}
