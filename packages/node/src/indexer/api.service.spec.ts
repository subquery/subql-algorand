// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { INestApplication } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { GraphQLSchema } from 'graphql';
import { SubqueryProject } from '../configure/SubqueryProject';
import { ApiService } from './api.service';

const ENDPOINT = 'https://algoindexer.algoexplorerapi.io';

function testSubqueryProject(endpoint: string): SubqueryProject {
  return {
    network: {
      endpoint,
      dictionary: `https://api.subquery.network/sq/subquery/Algorand-Dictionary`,
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
  ): Promise<ApiService> => {
    const module = await Test.createTestingModule({
      providers: [
        {
          provide: SubqueryProject,
          useFactory: () => testSubqueryProject(endpoint),
        },
        ApiService,
      ],
      imports: [EventEmitterModule.forRoot()],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    const apiService = app.get(ApiService);
    await apiService.init();
    return apiService;
  };

  it('can fetch block with hash', async () => {
    const apiService = await prepareApiService();

    const block = (await apiService.fetchBlocks([50000]))[0];

    expect(block.hash).toEqual('Gss169f22yVUBJzbNT9qXtQukjh0tgecvapaQY5NIRg=');
  });

  it('waits on pending block to fetch hash', async () => {
    const apiService = await prepareApiService();
    const api = apiService.getApi();

    const checkHealth = await api.makeHealthCheck().do();
    const currentRound = checkHealth.round;

    const fetchLatestBlock = async () =>
      (await apiService.fetchBlocks([currentRound]))[0];

    expect(fetchLatestBlock).not.toThrow();

    const block = await fetchLatestBlock();
    expect(block.hash).toBeDefined();
  });
});
