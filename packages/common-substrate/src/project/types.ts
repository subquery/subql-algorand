// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {IProjectManifest, ProjectNetworkConfig} from '@subql/common';
import {AlgorandDataSource} from '@subql/types';
import {RuntimeDataSourceV0_0_1} from '../project/versioned/v0_0_1';

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
  AlgorandNetworkFilter,
  AlgorandRuntimeHandlerFilter,
  AlgorandDataSourceKind,
  RuntimeHandlerInputMap as AlgorandRuntimeHandlerInputMap,
} from '@subql/types';

//make exception for runtime datasource 0.0.1
export type ISubstrateProjectManifest = IProjectManifest<AlgorandDataSource | RuntimeDataSourceV0_0_1>;

export interface AlgorandProjectNetworkConfig extends ProjectNetworkConfig {
  genesisHash?: string;
  chainId?: string;
  apiKey?: string;
  algorandRpc?: string;
  port?: number;
}
