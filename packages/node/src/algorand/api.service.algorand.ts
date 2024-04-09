// Copyright 2020-2023 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ApiService,
  ConnectionPoolService,
  getLogger,
  IBlock,
} from '@subql/node-core';
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

  async init(): Promise<AlgorandApiService> {
    let network;

    try {
      network = this.project.network;
    } catch (e) {
      logger.error(Object.keys(e));
      process.exit(1);
    }

    await this.createConnections(
      network,
      (endpoint) =>
        AlgorandApiConnection.create(endpoint, this.fetchBlockBatches),
      //eslint-disable-next-line @typescript-eslint/require-await
      async (connection: AlgorandApiConnection) => {
        return connection.unsafeApi.getGenesisHash();
      },
    );

    return this;
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
}
