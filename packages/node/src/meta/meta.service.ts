// Copyright 2020-2024 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import { Injectable } from '@nestjs/common';
import {
  BaseMetaService,
  NodeConfig,
  StoreCacheService,
} from '@subql/node-core';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version: algorandSdkVersion } = require('algosdk/package.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version: packageVersion } = require('../../package.json');

@Injectable()
export class MetaService extends BaseMetaService {
  protected packageVersion = packageVersion;
  protected sdkVersion(): { name: string; version: string } {
    return { name: 'algorandSdkVersion', version: algorandSdkVersion };
  }

  constructor(nodeConfig: NodeConfig, storeCacheService: StoreCacheService) {
    super(storeCacheService, nodeConfig);
  }
}
