// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {
  AlgorandCustomDataSource,
  AlgorandCustomHandler,
  AlgorandDataSource,
  AlgorandDataSourceKind,
  AlgorandHandler,
  AlgorandMapping,
  AlgorandRuntimeDataSource,
  AlgorandRuntimeHandler,
} from '@subql/types';
import {IAlgorandProjectManifest} from '../../types';

export interface SubqlMappingV0_0_1<T extends AlgorandHandler> extends AlgorandMapping<T> {
  file: string;
}

export type RuntimeDataSourceV0_0_1 = AlgorandRuntimeDataSource;
export type CustomDataSourceV0_0_1 = AlgorandCustomDataSource;

export interface ProjectManifestV0_0_1 extends IAlgorandProjectManifest {
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

  dataSources: (RuntimeDataSourceV0_0_1 | CustomDataSourceV0_0_1)[];
}

export function isRuntimeDataSourceV0_0_1(dataSource: AlgorandDataSource): dataSource is RuntimeDataSourceV0_0_1 {
  return dataSource.kind === AlgorandDataSourceKind.Runtime && !!(dataSource as RuntimeDataSourceV0_0_1).mapping.file;
}
