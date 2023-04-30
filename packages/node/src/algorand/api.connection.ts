// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiConnection, getLogger } from '@subql/node-core';
import { AlgorandApi } from './api.algorand';

const logger = getLogger('AlgorandApiConnection');

export class AlgorandApiConnection implements ApiConnection {
  constructor(readonly api: AlgorandApi) {}

  static async create(endpoint: string): Promise<AlgorandApiConnection> {
    const api = new AlgorandApi(endpoint);

    await api.init();

    return new AlgorandApiConnection(api);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async apiConnect(): Promise<void> {
    logger.debug('apiConnect is not implemented');
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async apiDisconnect(): Promise<void> {
    logger.debug('apiDisconnect is not implemented');
  }
}
