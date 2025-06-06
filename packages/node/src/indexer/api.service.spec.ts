// Copyright 2020-2025 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import { INestApplication } from '@nestjs/common';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import {
  ConnectionPoolService,
  ConnectionPoolStateManager,
  NodeConfig,
} from '@subql/node-core';
import { GraphQLSchema } from 'graphql';
import { AlgorandApiService } from '../algorand';
import { SubqueryProject } from '../configure/SubqueryProject';

const ENDPOINT = 'https://mainnet-idx.algonode.cloud/';

function testSubqueryProject(endpoint: string): SubqueryProject {
  return {
    network: {
      endpoint: [endpoint],
      dictionary: `https://api.subquery.network/sq/subquery/Algorand-Dictionary`,
      chainId: 'wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=',
    },
    dataSources: [],
    id: 'test',
    root: './',
    schema: new GraphQLSchema({}),
    templates: [],
  } as any;
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
        ConnectionPoolStateManager,
        ConnectionPoolService,
        NodeConfig,
        {
          provide: AlgorandApiService,
          useFactory: AlgorandApiService.init,
          inject: ['ISubqueryProject', ConnectionPoolService, EventEmitter2],
        },
      ],
      imports: [EventEmitterModule.forRoot()],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    const apiService = app.get(AlgorandApiService);

    return apiService;
  };

  it('can fetch block with hash', async () => {
    const apiService = await prepareApiService();

    const block = (await apiService.api.fetchBlocks([50000]))[0];

    expect(block.block.hash).toEqual(
      'Gss169f22yVUBJzbNT9qXtQukjh0tgecvapaQY5NIRg=',
    );
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
    expect(block.block.hash).toBeDefined();
  });
});
