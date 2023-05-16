// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Pino from 'pino';
import {Store, DynamicDatasourceCreator, SafeAPI} from './interfaces';

declare global {
  const api: SafeAPI;
  const logger: Pino.Logger;
  const store: Store;
  const chainId: string;
  const createDynamicDatasource: DynamicDatasourceCreator;
}
