// Copyright 2020-2025 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import { filterBlockTimestamp, Header, IBlock } from '@subql/node-core';
import {
  AlgorandBlock,
  AlgorandBlockFilter,
  AlgorandTransaction,
  AlgorandTransactionFilter,
} from '@subql/types-algorand';
import { Indexer, TransactionType } from 'algosdk';
import { camelCase, get } from 'lodash';
import { SubqlProjectBlockFilter } from '../configure/SubqueryProject';
import { BlockContent } from '../indexer/types';

export function algorandBlockToHeader(block: BlockContent): Header {
  return {
    blockHeight: block.round,
    blockHash: block.hash,
    parentHash: block.previousBlockHash,
    timestamp: new Date(block.timestamp),
  };
}

export function formatBlockUtil<B extends AlgorandBlock = AlgorandBlock>(
  block: B,
): IBlock<B> {
  return {
    block,
    getHeader: () => algorandBlockToHeader(block),
  };
}

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
  if (
    !filterBlockTimestamp(block.timestamp, filter as SubqlProjectBlockFilter)
  ) {
    return false;
  }
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

function txComparator(filter: any, data: any): boolean {
  if (Array.isArray(filter)) {
    for (let i = 0; i < filter.length; i++) {
      const valFilter = filter[i];
      const valData = data[i];

      if (valFilter === null) {
        continue;
      }

      if (valFilter !== valData) {
        return false;
      }
    }
    return true;
  }

  return filter === data;
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
      filterByKey[key] !== undefined &&
      !txComparator(
        filterByKey[key],
        get(txn, mappingFilterTransaction[txn.txType][key]),
      )
    ) {
      return false;
    }
  }

  return true;
}
