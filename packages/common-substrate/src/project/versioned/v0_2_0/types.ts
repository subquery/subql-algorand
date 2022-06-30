// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {ProjectManifestV0_2_0} from '@subql/common';
import {
  AlgorandCustomDataSource,
  AlgorandDataSource,
  AlgorandDataSourceKind,
  AlgorandRuntimeDataSource,
} from '@subql/types';

// export interface SubstrateMappingV0_2_0<F, T extends AlgorandRuntimeHandler> extends BaseMapping<T> {
//   file: string;
// }

export type RuntimeDataSourceV0_2_0 = AlgorandRuntimeDataSource;
export type CustomDataSourceV0_2_0 = AlgorandCustomDataSource;

export type SubstrateProjectManifestV0_2_0 = ProjectManifestV0_2_0<AlgorandDataSource>;

export function isDataSourceV0_2_0(
  dataSource: AlgorandDataSource
): dataSource is RuntimeDataSourceV0_2_0 | CustomDataSourceV0_2_0 {
  return !!(dataSource as RuntimeDataSourceV0_2_0).mapping.file;
}

export function isRuntimeDataSourceV0_2_0(dataSource: AlgorandDataSource): dataSource is RuntimeDataSourceV0_2_0 {
  return dataSource.kind === AlgorandDataSourceKind.Runtime && isDataSourceV0_2_0(dataSource);
}
