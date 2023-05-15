// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';
import path from 'path';
import { Inject, Injectable } from '@nestjs/common';
import {
  isCustomDs,
  AlgorandCustomDataSource as AlgorandCustomDs,
  AlgorandDataSource,
  AlgorandDataSourceProcessor,
} from '@subql/common-algorand';
import { BaseDsProcessorService } from '@subql/node-core';
import {
  SecondLayerHandlerProcessor_0_0_0,
  SecondLayerHandlerProcessor_1_0_0,
  AlgorandCustomDataSource,
  AlgorandHandlerKind,
} from '@subql/types-algorand';

export interface DsPluginSandboxOption {
  root: string;
  entry: string;
  script: string;
}

export function isSecondLayerHandlerProcessor_0_0_0<
  K extends AlgorandHandlerKind,
  F,
  E,
  DS extends AlgorandCustomDataSource = AlgorandCustomDataSource,
>(
  processor:
    | SecondLayerHandlerProcessor_0_0_0<K, F, E, DS>
    | SecondLayerHandlerProcessor_1_0_0<K, F, E, DS>,
): processor is SecondLayerHandlerProcessor_0_0_0<K, F, E, DS> {
  // Exisiting datasource processors had no concept of specVersion, therefore undefined is equivalent to 0.0.0
  return processor.specVersion === undefined;
}

export function isSecondLayerHandlerProcessor_1_0_0<
  K extends AlgorandHandlerKind,
  F,
  E,
  DS extends AlgorandCustomDataSource = AlgorandCustomDataSource,
>(
  processor:
    | SecondLayerHandlerProcessor_0_0_0<K, F, E, DS>
    | SecondLayerHandlerProcessor_1_0_0<K, F, E, DS>,
): processor is SecondLayerHandlerProcessor_1_0_0<K, F, E, DS> {
  return processor.specVersion === '1.0.0';
}

export function asSecondLayerHandlerProcessor_1_0_0<
  K extends AlgorandHandlerKind,
  F,
  E,
  DS extends AlgorandCustomDataSource = AlgorandCustomDataSource,
>(
  processor:
    | SecondLayerHandlerProcessor_0_0_0<K, F, E, DS>
    | SecondLayerHandlerProcessor_1_0_0<K, F, E, DS>,
): SecondLayerHandlerProcessor_1_0_0<K, F, E, DS> {
  if (isSecondLayerHandlerProcessor_1_0_0(processor)) {
    return processor;
  }

  if (!isSecondLayerHandlerProcessor_0_0_0(processor)) {
    throw new Error('Unsupported ds processor version');
  }

  return {
    ...processor,
    specVersion: '1.0.0',
    filterProcessor: (params) =>
      processor.filterProcessor(params.filter, params.input, params.ds),
    transformer: (params) =>
      processor
        .transformer(params.input, params.ds, params.api, params.assets)
        .then((res) => [res]),
  };
}

@Injectable()
export class DsProcessorService extends BaseDsProcessorService<
  AlgorandDataSource,
  AlgorandCustomDataSource<string>,
  AlgorandDataSourceProcessor<string>
> {
  protected isCustomDs = isCustomDs;
}
