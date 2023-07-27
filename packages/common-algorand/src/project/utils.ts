// Copyright 2020-2023 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import {
  SecondLayerHandlerProcessor,
  AlgorandCustomDataSource,
  AlgorandDataSource,
  AlgorandDataSourceKind,
  AlgorandHandlerKind,
  AlgorandRuntimeDataSource,
} from '@subql/types-algorand';

export function isBlockHandlerProcessor<E>(
  hp: SecondLayerHandlerProcessor<AlgorandHandlerKind, unknown, unknown>
): hp is SecondLayerHandlerProcessor<AlgorandHandlerKind.Block, unknown, E> {
  return hp.baseHandlerKind === AlgorandHandlerKind.Block;
}

export function isTransactionHandlerProcessor<E>(
  hp: SecondLayerHandlerProcessor<AlgorandHandlerKind, unknown, unknown>
): hp is SecondLayerHandlerProcessor<AlgorandHandlerKind.Transaction, unknown, E> {
  return hp.baseHandlerKind === AlgorandHandlerKind.Transaction;
}

export function isCustomDs(ds: AlgorandDataSource): ds is AlgorandCustomDataSource<string> {
  return ds.kind !== AlgorandDataSourceKind.Runtime && !!(ds as AlgorandCustomDataSource<string>).processor;
}

export function isRuntimeDs(ds: AlgorandDataSource): ds is AlgorandRuntimeDataSource {
  return ds.kind === AlgorandDataSourceKind.Runtime;
}
