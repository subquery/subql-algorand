// Copyright 2020-2025 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import {AlgorandDataSource} from '@subql/types-algorand';
import {IProjectManifest} from '@subql/types-core';

// All of these used to be redefined in this file, re-exporting for simplicity
export {
  AlgorandRuntimeHandler,
  AlgorandCustomHandler,
  AlgorandHandler,
  AlgorandHandlerKind,
  AlgorandDataSource as AlgorandDataSource,
  AlgorandCustomDataSource as AlgorandCustomDataSource,
  AlgorandBlockFilter,
  AlgorandDataSourceProcessor,
  AlgorandRuntimeHandlerFilter,
  AlgorandDataSourceKind,
  RuntimeHandlerInputMap as AlgorandRuntimeHandlerInputMap,
} from '@subql/types-algorand';

export type IAlgorandProjectManifest = IProjectManifest<AlgorandDataSource>;
