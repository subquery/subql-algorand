// Copyright 2020-2023 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import {ProjectManifestV1_0_0, TemplateBase} from '@subql/common';
import {
  AlgorandCustomDataSource,
  AlgorandDataSource,
  AlgorandDataSourceKind,
  AlgorandHandler,
  AlgorandMapping,
  AlgorandRuntimeDataSource,
} from '@subql/types-algorand';

export interface SubqlMappingV1_0_0<T extends AlgorandHandler> extends AlgorandMapping<T> {
  file: string;
}

export type RuntimeDataSourceV1_0_0 = AlgorandRuntimeDataSource;
export type CustomDataSourceV1_0_0 = AlgorandCustomDataSource;

export interface RuntimeDataSourceTemplate extends Omit<RuntimeDataSourceV1_0_0, 'name'>, TemplateBase {}
export interface CustomDataSourceTemplate extends Omit<CustomDataSourceV1_0_0, 'name'>, TemplateBase {}

export type AlgorandProjectManifestV1_0_0 = ProjectManifestV1_0_0<
  RuntimeDataSourceV1_0_0 | CustomDataSourceV1_0_0,
  RuntimeDataSourceTemplate | CustomDataSourceTemplate
>;

export function isRuntimeDataSourceV1_0_0(dataSource: AlgorandDataSource): dataSource is RuntimeDataSourceV1_0_0 {
  return dataSource.kind === AlgorandDataSourceKind.Runtime && !!(dataSource as RuntimeDataSourceV1_0_0).mapping.file;
}
