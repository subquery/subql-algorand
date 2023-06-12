// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {
  ApiConnectionError,
  ApiErrorType,
  IApiConnectionSpecific,
  NetworkMetadataPayload,
  getLogger,
} from '@subql/node-core';
import { BlockContent } from '../indexer/types';
import { AlgorandApi, SafeAPIService } from './api.algorand';

const logger = getLogger('AlgorandApiConnection');

type FetchFunc = (api: AlgorandApi, batch: number[]) => Promise<BlockContent[]>;

export class AlgorandApiConnection
  implements IApiConnectionSpecific<AlgorandApi, SafeAPIService, BlockContent>
{
  readonly networkMeta: NetworkMetadataPayload;

  constructor(
    public unsafeApi: AlgorandApi,
    private fetchBlocksBatches: FetchFunc,
  ) {
    this.networkMeta = {
      chain: unsafeApi.getChainId(),
      genesisHash: unsafeApi.getGenesisHash(),
      specName: undefined,
    };
  }

  static async create(
    endpoint: string,
    fetchBlocksBatches: FetchFunc,
  ): Promise<AlgorandApiConnection> {
    const api = new AlgorandApi(endpoint);

    await api.init();

    return new AlgorandApiConnection(api, fetchBlocksBatches);
  }

  safeApi(height: number): SafeAPIService {
    throw new Error(`Not Implemented`);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async apiConnect(): Promise<void> {
    logger.debug('apiConnect is not implemented');
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async apiDisconnect(): Promise<void> {
    logger.debug('apiDisconnect is not implemented');
  }

  async fetchBlocks(heights: number[]): Promise<BlockContent[]> {
    const blocks = await this.fetchBlocksBatches(this.unsafeApi, heights);
    return blocks;
  }

  handleError = AlgorandApiConnection.handleError;

  static handleError(e: Error): ApiConnectionError {
    let formatted_error: ApiConnectionError;
    if (e.message.includes(`Socket connection timeout`)) {
      formatted_error = AlgorandApiConnection.handleTimeoutError(e);
    } else if (e.message.startsWith(`disconnected from `)) {
      formatted_error = AlgorandApiConnection.handleDisconnectionError(e);
    } else if (e.message.startsWith(`Rate Limited at endpoint`)) {
      formatted_error = AlgorandApiConnection.handleRateLimitError(e);
    } else {
      formatted_error = new ApiConnectionError(
        e.name,
        e.message,
        ApiErrorType.Default,
      );
    }
    return formatted_error;
  }

  static handleRateLimitError(e: Error): ApiConnectionError {
    const formatted_error = new ApiConnectionError(
      'RateLimit',
      e.message,
      ApiErrorType.RateLimit,
    );
    return formatted_error;
  }

  static handleTimeoutError(e: Error): ApiConnectionError {
    const formatted_error = new ApiConnectionError(
      'TimeoutError',
      e.message,
      ApiErrorType.Timeout,
    );
    return formatted_error;
  }

  static handleDisconnectionError(e: Error): ApiConnectionError {
    const formatted_error = new ApiConnectionError(
      'ConnectionError',
      e.message,
      ApiErrorType.Connection,
    );
    return formatted_error;
  }
}
