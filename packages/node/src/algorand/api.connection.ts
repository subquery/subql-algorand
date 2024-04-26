// Copyright 2020-2024 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import {
  ApiConnectionError,
  ApiErrorType,
  IApiConnectionSpecific,
  NetworkMetadataPayload,
  getLogger,
  IBlock,
} from '@subql/node-core';
import { BlockContent } from '../indexer/types';
import { AlgorandApi, SafeAPIService } from './api.algorand';

const logger = getLogger('AlgorandApiConnection');

type FetchFunc = (
  api: AlgorandApi,
  batch: number[],
) => Promise<IBlock<BlockContent>[]>;

export class AlgorandApiConnection
  implements
    IApiConnectionSpecific<AlgorandApi, SafeAPIService, IBlock<BlockContent>[]>
{
  readonly networkMeta: NetworkMetadataPayload;

  private constructor(
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
    return this.unsafeApi.getSafeApi(height);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async apiConnect(): Promise<void> {
    logger.debug('apiConnect is not implemented');
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async apiDisconnect(): Promise<void> {
    logger.debug('apiDisconnect is not implemented');
  }

  async fetchBlocks(heights: number[]): Promise<IBlock<BlockContent>[]> {
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
    } else if (
      e.message.startsWith(`Rate Limited at endpoint`) ||
      (e as any).statusCode === 429
    ) {
      formatted_error = AlgorandApiConnection.handleRateLimitError(e);
    } else if (e.message.includes(`Exceeded max limit of`)) {
      formatted_error = AlgorandApiConnection.handleLargeResponseError(e);
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
    return new ApiConnectionError(
      'RateLimit',
      e.message,
      ApiErrorType.RateLimit,
    );
  }

  static handleTimeoutError(e: Error): ApiConnectionError {
    return new ApiConnectionError(
      'TimeoutError',
      e.message,
      ApiErrorType.Timeout,
    );
  }

  static handleDisconnectionError(e: Error): ApiConnectionError {
    return new ApiConnectionError(
      'ConnectionError',
      e.message,
      ApiErrorType.Connection,
    );
  }

  static handleLargeResponseError(e: Error): ApiConnectionError {
    const newMessage = `Oversized RPC node response. This issue is related to the network's RPC nodes configuration, not your application. You may report it to the network's maintainers or try a different RPC node.\n\n${e.message}`;

    return new ApiConnectionError(
      'RpcInternalError',
      newMessage,
      ApiErrorType.Default,
    );
  }
}
