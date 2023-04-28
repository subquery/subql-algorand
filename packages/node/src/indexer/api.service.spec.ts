// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { INestApplication } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { NodeConfig } from '@subql/node-core';
import { GraphQLSchema } from 'graphql';
import { AlgorandApiService } from '../algorand';
import { SubqueryProject } from '../configure/SubqueryProject';

const ENDPOINT = 'https://algoindexer.algoexplorerapi.io';

function testSubqueryProject(endpoint: string): SubqueryProject {
  return {
    network: {
      endpoint,
      dictionary: `https://api.subquery.network/sq/subquery/Algorand-Dictionary`,
      chainId: '',
    },
    dataSources: [],
    id: 'test',
    root: './',
    schema: new GraphQLSchema({}),
    templates: [],
  };
}

jest.setTimeout(90000);
describe('ApiService', () => {
  let app: INestApplication;

  afterEach(() => {
    return app?.close();
  });

  const prepareApiService = async (
    endpoint: string = ENDPOINT,
  ): Promise<AlgorandApiService> => {
    const module = await Test.createTestingModule({
      providers: [
        {
          provide: 'ISubqueryProject',
          useFactory: () => testSubqueryProject(endpoint),
        },
        NodeConfig,
        AlgorandApiService,
      ],
      imports: [EventEmitterModule.forRoot()],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    const apiService = app.get(AlgorandApiService);
    await apiService.init();
    return apiService;
  };

  it('can fetch block with hash', async () => {
    const apiService = await prepareApiService();

    const block = (await apiService.api.fetchBlocks([50000]))[0];

    expect(block.hash).toEqual('Gss169f22yVUBJzbNT9qXtQukjh0tgecvapaQY5NIRg=');
  });

  it('waits on pending block to fetch hash', async () => {
    const apiService = await prepareApiService();
    const api = apiService.api;

    const checkHealth = await api.api.makeHealthCheck().do();
    const currentRound = checkHealth.round;

    const fetchLatestBlock = async () =>
      (await apiService.api.fetchBlocks([currentRound]))[0];

    expect(fetchLatestBlock).not.toThrow();

    const block = await fetchLatestBlock();
    expect(block.hash).toBeDefined();
  });
});
