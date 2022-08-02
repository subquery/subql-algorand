// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/api-augment/substrate';
import {
  AlgorandBlock,
  AlgorandBlockFilter,
  AlgorandTransaction,
  AlgorandTransactionFilter,
} from '@subql/types-algorand';
import { Indexer, TransactionType } from 'algosdk';
import { get } from 'lodash';
import { getLogger } from './logger';
import { camelCaseObjectKey } from './object';
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

export function filterBlock(
  block: AlgorandBlock,
  filter?: AlgorandBlockFilter,
): boolean {
  // no filters for block.
  return true;
}

export function filterTransaction(
  txn: AlgorandTransaction,
  filter?: AlgorandTransactionFilter,
): boolean {
  if (!filter || !filter.txType) return true;
  const { txType, ...filterByKey } = filter;
  let validate = true;
  validate = validate && txn.txType === txType;

  for (const key in filterByKey) {
    validate =
      validate &&
      filterByKey[key] === get(txn, mappingFilterTransaction[txType][key]);
  }

  return validate;
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
