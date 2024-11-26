// Copyright 2020-2024 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import { INestApplication } from '@nestjs/common';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import {
  ApiService,
  ConnectionPoolService,
  ConnectionPoolStateManager,
  NodeConfig,
} from '@subql/node-core';
import { GraphQLSchema } from 'graphql';
import { AlgorandApiService, filterTransaction } from '../algorand';
import { SubqueryProject } from '../configure/SubqueryProject';

const mainnetEndpoint = 'https://mainnet-idx.algonode.cloud/';
const testnetEndpoint = 'https://testnet-idx.algonode.cloud';

const mainnetChainId = 'wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=';
const testnetChainId = 'SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=';

function testSubqueryProject(endpoint: string, chainId): SubqueryProject {
  return {
    network: {
      chainId,
      endpoint: [endpoint],
      dictionary: `https://api.subquery.network/sq/subquery/Algorand-Dictionary`,
    },
    dataSources: [],
    id: 'test',
    root: './',
    schema: new GraphQLSchema({}),
    templates: [],
  } as any;
}

// eslint-disable-next-line jest/no-export
export const prepareApiService = async (
  endpoint: string = mainnetEndpoint,
  chainId: string = mainnetChainId,
): Promise<[INestApplication, AlgorandApiService]> => {
  const module = await Test.createTestingModule({
    providers: [
      {
        provide: 'ISubqueryProject',
        useFactory: () => testSubqueryProject(endpoint, chainId),
      },
      NodeConfig,
      ConnectionPoolStateManager,
      ConnectionPoolService,
      {
        provide: AlgorandApiService,
        useFactory: AlgorandApiService.init,
        inject: ['ISubqueryProject', ConnectionPoolService, EventEmitter2],
      },
    ],
    imports: [EventEmitterModule.forRoot()],
  }).compile();

  const app = module.createNestApplication();
  await app.init();
  const apiService = app.get(AlgorandApiService);

  return [app, apiService];
};

jest.setTimeout(90000);
describe('Algorand RPC', () => {
  let app: INestApplication;
  let apiService: ApiService;

  afterEach(() => {
    return app?.close();
  });

  it('Can filter acfg with sender', () => {
    const tx = {
      assetConfigTransaction: {
        assetId: 0,
        params: {
          clawback:
            '7JMGBIDKQRR4MC3DNC73QU4QUNNN43VNY5RYPN2FRWEG6NXAHQMCPD4BIQ',
          creator: '7JMGBIDKQRR4MC3DNC73QU4QUNNN43VNY5RYPN2FRWEG6NXAHQMCPD4BIQ',
          decimals: 0,
          defaultFrozen: false,
          freeze: '7JMGBIDKQRR4MC3DNC73QU4QUNNN43VNY5RYPN2FRWEG6NXAHQMCPD4BIQ',
          manager: '7JMGBIDKQRR4MC3DNC73QU4QUNNN43VNY5RYPN2FRWEG6NXAHQMCPD4BIQ',
          name: 'flowTest.algo',
          nameB64: 'Zmxvd1Rlc3QuYWxnbw==',
          reserve: '7JMGBIDKQRR4MC3DNC73QU4QUNNN43VNY5RYPN2FRWEG6NXAHQMCPD4BIQ',
          total: 1,
          unitName: 'xAns',
          unitNameB64: 'eEFucw==',
          url: 'https://xgov.app',
          urlB64: 'aHR0cHM6Ly94Z292LmFwcA==',
        },
      },
      closeRewards: 0,
      closingAmount: 0,
      confirmedRound: 27081666,
      createdAssetIndex: 154583116,
      fee: 1000,
      firstValid: 27081664,
      genesisHash: 'SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
      genesisId: 'testnet-v1.0',
      id: '5CUFVHAA7XZFZDRXO5J2Q26O6O4KB6DHSOB54P5LO3S57S2JF5NA',
      intraRoundOffset: 12,
      lastValid: 27082664,
      receiverRewards: 0,
      roundTime: 1674020229,
      sender: '7JMGBIDKQRR4MC3DNC73QU4QUNNN43VNY5RYPN2FRWEG6NXAHQMCPD4BIQ',
      senderRewards: 0,
      signature: {
        sig: 'rawhKc26WQe98vKweozDOJmH32c60fI83ddi5kwXg2BYu8EJCh0V3dlzRkOcY/4C3Gh7Bkzi12Yte9EejE1QBw==',
      },
      txType: 'acfg',
    };

    expect(
      filterTransaction(tx as any, {
        txType: 'acfg',
        sender: '7JMGBIDKQRR4MC3DNC73QU4QUNNN43VNY5RYPN2FRWEG6NXAHQMCPD4BIQ',
      }),
    ).toBe(true);
  });

  // This is failing since switching from algo explorer api. This is due to a node configuration limit
  it('paginate large blocks', async () => {
    [app, apiService] = await prepareApiService(
      testnetEndpoint,
      testnetChainId,
    );
    const failingBlock = 27739202; // testnet
    const api = apiService.api;

    const paginateSpy = jest.spyOn(api, 'paginatedTransactions');
    const result = await api.getBlockByHeight(failingBlock);
    expect(paginateSpy).toHaveBeenCalledTimes(3);
    expect(result.transactions.length).toEqual(13916);
  });

  it('can stringify blocks and transactions with circular references', async () => {
    [app, apiService] = await prepareApiService();

    const block = await apiService.api.getBlockByHeight(30478896);

    // The circular ref
    expect(block.transactions[13].block).toBeDefined();

    // We can stringify the objects
    expect(() => JSON.stringify(block)).not.toThrow();
    expect(() => JSON.stringify(block.transactions[13])).not.toThrow();

    expect(JSON.parse(JSON.stringify(block)).round).toEqual(block.round);
  });

  it('can get the grouped transactions within a block', async () => {
    [app, apiService] = await prepareApiService();

    const block = await apiService.api.getBlockByHeight(30478896);

    const groupTx = block.getTransactionsByGroup(block.transactions[13].group);

    expect(groupTx.length).toEqual(3);
  });
});
