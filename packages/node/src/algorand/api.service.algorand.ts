// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

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

    const endpointToApiIndex: Record<string, AlgorandApiConnection> = {};

    await Promise.all(
      endpoints.map(async (endpoint, i) => {
        const connection = await AlgorandApiConnection.create(
          endpoint,
          this.fetchBlockBatches,
        );

        const api = connection.unsafeApi;

        this.eventEmitter.emit(IndexerEvent.ApiConnected, {
          value: 1,
          apiIndex: i,
          endpoint: endpoint,
        });

        // api.on('connected', () => {
        //   this.eventEmitter.emit(IndexerEvent.ApiConnected, {
        //     value: 1,
        //     apiIndex: i,
        //     endpoint: endpoint,
        //   });
        // });
        // api.on('disconnected', () => {
        //   this.eventEmitter.emit(IndexerEvent.ApiConnected, {
        //     value: 0,
        //     apiIndex: i,
        //     endpoint: endpoint,
        //   });
        //   void this.connectionPoolService.handleApiDisconnects(i, endpoint);
        // });
        if (!this.networkMeta) {
          this.networkMeta = connection.networkMeta;
        }

        if (network.chainId !== api.getGenesisHash()) {
          throw this.metadataMismatchError(
            'ChainId',
            network.chainId,
            api.getGenesisHash(),
          );
        }

        endpointToApiIndex[endpoint] = connection;
      }),
    );

    this.connectionPoolService.addBatchToConnections(endpointToApiIndex);

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
