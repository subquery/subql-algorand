// Copyright 2020-2023 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProjectNetworkV1_0_0 } from '@subql/common-algorand';
import {
  ApiService,
  ConnectionPoolService,
  getLogger,
  IndexerEvent,
  NetworkMetadataPayload,
} from '@subql/node-core';
import { AlgorandBlock } from '@subql/types-algorand';
import { SubqueryProject } from '../configure/SubqueryProject';
import { BlockContent } from '../indexer/types';
import { AlgorandApi, SafeAPIService } from './api.algorand';
import { AlgorandApiConnection } from './api.connection';

const logger = getLogger('api');

@Injectable()
export class AlgorandApiService extends ApiService<
  AlgorandApi,
  SafeAPIService,
  BlockContent
> {
  networkMeta: NetworkMetadataPayload;
  constructor(
    @Inject('ISubqueryProject') private project: SubqueryProject,
    connectionPoolService: ConnectionPoolService<AlgorandApiConnection>,
    private eventEmitter: EventEmitter2,
  ) {
    super(connectionPoolService);
  }

  async connectWithRetry(
    endpoint: string,
    index: number,
    maxRetries: number,
    retryInterval: number,
  ): Promise<void> {
    let retries = 0;

    const tryConnect = async () => {
      try {
        const connection = await AlgorandApiConnection.create(
          endpoint,
          this.fetchBlockBatches,
        );
        const api = connection.unsafeApi;

        if (!this.networkMeta) {
          this.networkMeta = connection.networkMeta;
        }

        if (this.project.network.chainId !== api.getGenesisHash()) {
          throw this.metadataMismatchError(
            'ChainId',
            this.project.network.chainId,
            api.getGenesisHash(),
          );
        }

        await this.connectionPoolService.addToConnections(connection, endpoint);
      } catch (error) {
        if (retries < maxRetries) {
          retries++;
          logger.warn(
            `Failed to start up endpoint ${endpoint} (retry ${retries}/${maxRetries}): ${error.message}`,
          );
          setTimeout(() => {
            tryConnect();
          }, retryInterval);
        } else {
          logger.error(
            `Failed to start up endpoint ${endpoint} after ${maxRetries} retries: ${error.message}`,
          );
        }
      }
    };

    await tryConnect();
  }

  async init(): Promise<AlgorandApiService> {
    let network: ProjectNetworkV1_0_0;

    try {
      network = this.project.network;
    } catch (e) {
      logger.error(Object.keys(e));
      process.exit(1);
    }

    const endpoints = Array.isArray(network.endpoint)
      ? network.endpoint
      : [network.endpoint];

    const maxRetries = 3;
    const retryInterval = 30000; // 30 seconds
    const connectionPromises: Promise<void>[] = [];

    endpoints.forEach((endpoint, i) => {
      connectionPromises.push(
        this.connectWithRetry(endpoint, i, maxRetries, retryInterval),
      );
    });

    // Wait for at least one successful connection before proceeding
    await Promise.race(connectionPromises);

    return this;
  }

  get api(): AlgorandApi {
    return this.unsafeApi;
  }

  private metadataMismatchError(
    metadata: string,
    expected: string,
    actual: string,
  ): Error {
    return Error(
      `Value of ${metadata} does not match across all endpoints. Please check that your endpoints are for the same network.\n
       Expected: ${expected}
       Actual: ${actual}`,
    );
  }

  async fetchBlockBatches(
    api: AlgorandApi,
    blocks: number[],
  ): Promise<BlockContent[]> {
    return api.fetchBlocks(blocks);
  }
}
