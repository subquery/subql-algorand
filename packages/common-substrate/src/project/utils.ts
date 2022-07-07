// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {
  SecondLayerHandlerProcessor,
  AlgorandCustomDataSource,
  AlgorandDataSource,
  AlgorandDataSourceKind,
  AlgorandHandlerKind,
  AlgorandNetworkFilter,
  AlgorandRuntimeDataSource,
} from '@subql/types';

export function isBlockHandlerProcessor<T extends AlgorandNetworkFilter, E>(
  hp: SecondLayerHandlerProcessor<AlgorandHandlerKind, T, unknown>
): hp is SecondLayerHandlerProcessor<AlgorandHandlerKind.Block, T, E> {
  return hp.baseHandlerKind === AlgorandHandlerKind.Block;
}

export function isTransactionHandlerProcessor<T extends AlgorandNetworkFilter, E>(
  hp: SecondLayerHandlerProcessor<AlgorandHandlerKind, T, unknown>
): hp is SecondLayerHandlerProcessor<AlgorandHandlerKind.Block, T, E> {
  return hp.baseHandlerKind === AlgorandHandlerKind.Transaction;
}

export function isCustomDs<F extends AlgorandNetworkFilter>(
  ds: AlgorandDataSource
): ds is AlgorandCustomDataSource<string, F> {
  return ds.kind !== AlgorandDataSourceKind.Runtime && !!(ds as AlgorandCustomDataSource<string, F>).processor;
}

export function isRuntimeDs(ds: AlgorandDataSource): ds is AlgorandRuntimeDataSource {
  return ds.kind === AlgorandDataSourceKind.Runtime;
}
