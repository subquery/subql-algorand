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

export function isBlockHandlerProcessor<F extends Record<string, unknown>, E>(
  hp: SecondLayerHandlerProcessor<AlgorandHandlerKind, F, unknown>
): hp is SecondLayerHandlerProcessor<AlgorandHandlerKind.Block, F, E> {
  return hp.baseHandlerKind === AlgorandHandlerKind.Block;
}

export function isTransactionHandlerProcessor<F extends Record<string, unknown>, E>(
  hp: SecondLayerHandlerProcessor<AlgorandHandlerKind, F, unknown>
): hp is SecondLayerHandlerProcessor<AlgorandHandlerKind.Transaction, F, E> {
  return hp.baseHandlerKind === AlgorandHandlerKind.Transaction;
}

export function isCustomDs(ds: AlgorandDataSource): ds is AlgorandCustomDataSource<string> {
  return ds.kind !== AlgorandDataSourceKind.Runtime && !!(ds as AlgorandCustomDataSource<string>).processor;
}

export function isRuntimeDs(ds: AlgorandDataSource): ds is AlgorandRuntimeDataSource {
  return ds.kind === AlgorandDataSourceKind.Runtime;
}
