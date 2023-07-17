// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {
  AlgorandBlock,
  AlgorandBlockFilter,
  AlgorandTransaction,
  AlgorandTransactionFilter,
} from '@subql/types-algorand';
import { Indexer, TransactionType } from 'algosdk';
import { camelCase, get } from 'lodash';

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

export function calcInterval(api: Indexer): number {
  // Pulled from https://metrics.algorand.org/#/protocol/#blocks
  return 3300;
}

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
    applicationArgs: 'applicationTransaction.applicationArgs',
    sender: 'sender',
  },
};

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

function txComparator(a: any, b: any): boolean {
  if (Array.isArray(a)) {
    for (let i = 0; i < a.length; i++) {
      const valA = a[i];
      const valB = b[i];

      if (valA === null) {
        continue;
      }

      if (valA !== valB) {
        return false;
      }
    }
    return true;
  }

  return a === b;
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
      !txComparator(
        filterByKey[key],
        get(txn, mappingFilterTransaction[txn.txType][key]),
      )
      // filterByKey[key] !== get(txn, mappingFilterTransaction[txn.txType][key])
    ) {
      return false;
    }
  }

  return true;
}
