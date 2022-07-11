// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Injectable } from '@nestjs/common';
import { TokenHeader } from '@subql/common-substrate';
import algosdk, { Indexer } from 'algosdk';
import { SubqueryProject } from '../configure/SubqueryProject';
import { getLogger } from '../utils/logger';
import { NetworkMetadataPayload } from './events';

const logger = getLogger('api');

@Injectable()
export class ApiService {
  private api: Indexer;
  networkMeta: NetworkMetadataPayload;

  constructor(protected project: SubqueryProject) {}

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
}
