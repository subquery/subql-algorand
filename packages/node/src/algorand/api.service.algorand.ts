// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TokenHeader } from '@subql/common-algorand';
import { ApiService, getLogger } from '@subql/node-core';
import algosdk from 'algosdk';
import { SubqueryProject } from '../configure/SubqueryProject';
import { AlgorandApi } from './api.algorand';

const logger = getLogger('api');

@Injectable()
export class AlgorandApiService extends ApiService {
  constructor(
    @Inject('ISubqueryProject') project: SubqueryProject,
    private eventEmitter: EventEmitter2,
  ) {
    super(project);
  }
  private _api: AlgorandApi;

  async init(): Promise<AlgorandApiService> {
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

    this.api = new AlgorandApi(network.endpoint);
  }

  get api(): AlgorandApi {
    return this._api;
  }

  private set api(value: AlgorandApi) {
    this._api = value;
  }
}
