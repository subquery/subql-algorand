// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProjectNetworkV1_0_0 } from '@subql/common-algorand';
import { ApiService, getLogger } from '@subql/node-core';
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
    let network: ProjectNetworkV1_0_0;

    try {
      network = this.project.network;
    } catch (e) {
      logger.error(Object.keys(e));
      process.exit(1);
    }
    this.api = new AlgorandApi(network.endpoint);
    await this.api.init();

    this.networkMeta = {
      chain: this.api.getChainId(),
      genesisHash: this.api.getGenesisHash(),
      specName: undefined,
    };

    if (network.chainId && network.chainId !== this.api.getGenesisHash()) {
      const err = new Error(
        `Network chainId doesn't match expected genesisHash. Your SubQuery project is expecting to index data from "${
          network.chainId ?? network.genesisHash
        }", however the endpoint that you are connecting to is different("${
          this.networkMeta.genesisHash
        }). Please check that the RPC endpoint is actually for your desired network or update the genesisHash.`,
      );
      logger.error(err, err.message);
      throw err;
    }

    return this;
  }

  get api(): AlgorandApi {
    return this._api;
  }

  private set api(value: AlgorandApi) {
    this._api = value;
  }
}
