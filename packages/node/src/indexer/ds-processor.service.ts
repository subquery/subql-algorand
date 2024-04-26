// Copyright 2020-2024 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import { Injectable } from '@nestjs/common';
import {
  isCustomDs,
  AlgorandDataSource,
  AlgorandDataSourceProcessor,
} from '@subql/common-algorand';
import { BaseDsProcessorService } from '@subql/node-core';
import { AlgorandCustomDataSource } from '@subql/types-algorand';

export interface DsPluginSandboxOption {
  root: string;
  entry: string;
  script: string;
}

@Injectable()
export class DsProcessorService extends BaseDsProcessorService<
  AlgorandDataSource,
  AlgorandCustomDataSource<string>,
  AlgorandDataSourceProcessor<string>
> {
  protected isCustomDs = isCustomDs;
}
