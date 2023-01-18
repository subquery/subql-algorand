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
import { camelCase, get } from 'lodash';
const logger = getLogger('fetch');

export const mappingFilterTransaction = {
  [TransactionType.pay]: {
    sender: 'sender',
    receiver: 'paymentTransaction.receiver',
  },
  [TransactionType.keyreg]: {
    nonParticipant: 'keyregTransaction.nonParticipation',
  },
  [TransactionType.acfg]: {
    assetId: 'assetConfigTransaction.assetId',
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
): Promise<AlgorandBlock> {
  try {
    const blockInfo = await api.lookupBlock(height).do();
    return camelCaseObjectKey(blockInfo);
  } catch (error) {
    logger.error(`failed to fetch Block at round ${height}`);
    throw error;
  }
}

export async function fetchBlocksArray(
  api: Indexer,
  blockArray: number[],
): Promise<any[]> {
  return Promise.all(
    blockArray.map(async (height) => getBlockByHeight(api, height)),
  );
}

export async function fetchBlocksBatches(
  api: Indexer,
  blockArray: number[],
): Promise<AlgorandBlock[]> {
  return fetchBlocksArray(api, blockArray);
}

export function calcInterval(api: Indexer): number {
  // Pulled from https://metrics.algorand.org/#/protocol/#blocks
  return 4300;
}
