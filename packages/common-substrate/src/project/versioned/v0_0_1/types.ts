// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {RegisteredTypes} from '@polkadot/types/types';
import {BaseMapping, IProjectManifest} from '@subql/common';
import {
  AlgorandRuntimeDataSource,
  AlgorandNetworkFilter,
  AlgorandRuntimeHandlerFilter,
  AlgorandRuntimeHandler,
  AlgorandDataSourceKind,
} from '@subql/types';
import {AlgorandProjectNetworkConfig} from '../../types';

export type ProjectNetworkConfigV0_0_1 = AlgorandProjectNetworkConfig & RegisteredTypes;

// export interface RuntimeDataSourceV0_0_1 extends AlgorandRuntimeDataSource {
//   name: string;
//   filter?: AlgorandNetworkFilter;
// }

export type ManifestV0_0_1Mapping = Omit<BaseMapping<AlgorandRuntimeHandlerFilter, AlgorandRuntimeHandler>, 'file'>;

export interface RuntimeDataSourceV0_0_1 extends Omit<AlgorandRuntimeDataSource, 'mapping'> {
  name: string;
  filter?: AlgorandNetworkFilter;
  kind: AlgorandDataSourceKind.Runtime;
  mapping: ManifestV0_0_1Mapping;
}

export interface ProjectManifestV0_0_1 extends IProjectManifest<RuntimeDataSourceV0_0_1> {
  schema: string;
  network: ProjectNetworkConfigV0_0_1;
}
