// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { getLogger } from '@subql/node-core';
import {
  AlgorandBlock,
  AlgorandBlockFilter,
  AlgorandTransaction,
  AlgorandTransactionFilter,
} from '@subql/types-algorand';
import { Indexer, TransactionType } from 'algosdk';
import axios from 'axios';
import { camelCase, get } from 'lodash';
const logger = getLogger('fetch');

export const mappingFilterTransaction = {
  [TransactionType.pay]: {
    sender: 'sender',
    receiver: 'paymentTransaction.receiver',
  },
  [TransactionType.keyreg]: {
    nonParticipant: 'keyregTransaction.nonParticipation',
    sender: 'sender',
  },
  [TransactionType.acfg]: {
    assetId: 'assetConfigTransaction.assetId',
    sender: 'sender',
  },
  [TransactionType.axfer]: {
    assetId: 'assetTransferTransaction.assetId',
    sender: 'sender',
    receiver: 'assetTransferTransaction.receiver',
  },
  [TransactionType.afrz]: {
    assetId: 'assetFreezeTransaction.assetId',
    newFreezeStatus: 'assetFreezeTransaction.newFreezeStatus',
    address: 'sender',
  },
  [TransactionType.appl]: {
    applicationId: 'applicationTransaction.applicationId',
    sender: 'sender',
  },
};

export function camelCaseObjectKey(object: object) {
  if (Array.isArray(object)) {
    return object.map((v) => camelCaseObjectKey(v));
  } else if (object !== null && object.constructor === Object) {
    return Object.keys(object).reduce(
      (result, key) => ({
        ...result,
        [camelCase(key)]: camelCaseObjectKey(object[key]),
      }),
      {},
    );
  }

  return object;
}

export function filterBlock(
  block: AlgorandBlock,
  filter?: AlgorandBlockFilter,
): boolean {
  if (!filter) return true;
  if (!filterBlockModulo(block, filter)) return false;
  // no filters for block.
  return true;
}

export function filterBlockModulo(
  block: AlgorandBlock,
  filter: AlgorandBlockFilter,
): boolean {
  const { modulo } = filter;
  if (!modulo) return true;
  return block.round % modulo === 0;
}

export function filterTransaction(
  txn: AlgorandTransaction,
  filter?: AlgorandTransactionFilter,
): boolean {
  if (!filter) return true;
  const { txType, ...filterByKey } = filter;

  if (txType && txn.txType !== txType) return false;

  for (const key in filterByKey) {
    if (
      mappingFilterTransaction[txn.txType] &&
      filterByKey[key] !== get(txn, mappingFilterTransaction[txn.txType][key])
    ) {
      return false;
    }
  }

  return true;
}

export async function getBlockByHeight(
  api: Indexer,
  height: number,
  endpoint: string,
): Promise<AlgorandBlock> {
  try {
    const blockInfo = await api.lookupBlock(height).do();
    return camelCaseObjectKey(blockInfo);
  } catch (error) {
    if (error.message.includes('Max transactions limit exceeded')) {
      logger.warn('Max transactions limit exceeded, paging transactions');

      const header = camelCaseObjectKey(await getHeaderOnly(height));
      console.log('header: ', header);
      return paginatedTransactions(height, endpoint);
    }
    logger.error(`failed to fetch Block at round ${height}`);
    throw error;
  }
}

async function getHeaderOnly(block: number): Promise<any> {
  try {
    const testNetEndpoint = 'https://algoindexer.testnet.algoexplorerapi.io';
    const result = (
      await axios({
        params: {
          'header-only': true,
        },
        method: 'get',
        url: `/v2/blocks/${block}`,
        baseURL: testNetEndpoint,
      })
    ).data;
    console.log('header-only: ', result);
    return result;
  } catch (e) {
    console.error(e.message);
    throw e;
  }
}

export async function paginatedTransactions(
  blockHeight: number,
  endpoint: string,
  nextToken?: string,
): Promise<any> {
  const pageLimit = 10000;
  try {
    // const testNetEndpoint = 'https://algoindexer.testnet.algoexplorerapi.io';
    const result: { transactions: any[] } = (
      await axios({
        params: {
          round: blockHeight,
          limit: pageLimit,
          next: nextToken,
        },
        method: 'get',
        url: `/v2/transactions`,
        baseURL: endpoint,
      })
    ).data;
    // greater or equal
    if (result.transactions.length > 0) {
      const savedResult = result;
      // console.log('pagination: ', result)

      return (
        await paginatedTransactions(blockHeight, savedResult['next-token'])
      ).concat(savedResult);
    }
    return result;
  } catch (e) {
    logger.error('Failed to paginate, oh no', e);
    throw e;
  }
}

async function paginateBlock(
  blockHeight: number,
  endpoint: string,
): Promise<AlgorandBlock> {
  try {
    const [blockHeader, paginatedTransactionsResults] = await Promise.all([
      getHeaderOnly(blockHeight),
      paginatedTransactions(blockHeight, endpoint),
    ]);
    const header = camelCaseObjectKey(blockHeader);
    header.transactions = camelCaseObjectKey(paginatedTransactionsResults);
    return header;
  } catch (e) {
    logger.error('Failed to paginate');
    throw e;
  }
}

export async function fetchBlocksArray(
  api: Indexer,
  blockArray: number[],
  endpoint: string,
): Promise<any[]> {
  return Promise.all(
    blockArray.map(async (height) => getBlockByHeight(api, height, endpoint)),
  );
}

export async function fetchBlocksBatches(
  api: Indexer,
  blockArray: number[],
  endpoint: string,
): Promise<AlgorandBlock[]> {
  return fetchBlocksArray(api, blockArray, endpoint);
}

export function calcInterval(api: Indexer): number {
  // Pulled from https://metrics.algorand.org/#/protocol/#blocks
  return 4300;
}
