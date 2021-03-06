// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {TemplateBase} from '@subql/common';
import {
  AlgorandCustomDataSource,
  AlgorandDataSource,
  AlgorandDataSourceKind,
  AlgorandHandler,
  AlgorandMapping,
  AlgorandRuntimeDataSource,
} from '@subql/types-algorand';
import {IAlgorandProjectManifest} from '../../types';

export interface SubqlMappingV1_0_0<T extends AlgorandHandler> extends AlgorandMapping<T> {
  file: string;
}

export type RuntimeDataSourceV1_0_0 = AlgorandRuntimeDataSource;
export type CustomDataSourceV1_0_0 = AlgorandCustomDataSource;

export interface RuntimeDataSourceTemplate extends Omit<RuntimeDataSourceV1_0_0, 'name'>, TemplateBase {}
export interface CustomDataSourceTemplate extends Omit<CustomDataSourceV1_0_0, 'name'>, TemplateBase {}

export interface ProjectManifestV1_0_0 extends IAlgorandProjectManifest {
  name: string;
  version: string;
  schema: {
    file: string;
  };

  network: {
    endpoint?: string;
    dictionary?: string;
    chainId: string;
  };

  dataSources: (RuntimeDataSourceV1_0_0 | CustomDataSourceV1_0_0)[];
}

export function isRuntimeDataSourceV1_0_0(dataSource: AlgorandDataSource): dataSource is RuntimeDataSourceV1_0_0 {
  return dataSource.kind === AlgorandDataSourceKind.Runtime && !!(dataSource as RuntimeDataSourceV1_0_0).mapping.file;
}
