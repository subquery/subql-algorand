// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiPromise } from '@polkadot/api';
import { ApiDecoration } from '@polkadot/api/types';
import {
  Entity,
  // SubstrateBlock,
  // SubstrateEvent,
  // SubstrateExtrinsic,
} from '@subql/types';
import { Indexer, Transaction } from 'algosdk';
export interface BlockContent {
  description: string;
  transactions: Transaction[];
}

export enum OperationType {
  Set = 'Set',
  Remove = 'Remove',
}

export type OperationEntity = {
  operation: OperationType;
  entityType: string;
  data: Entity | string;
};

export type SafeAPI = {
  indexer: Indexer;
};
