// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {Indexer} from 'algosdk';
import Pino from 'pino';
import {Store, DynamicDatasourceCreator} from './interfaces';

type SafeAPI = {
  indexer: Indexer;
};

declare global {
  const api: SafeAPI;
  const logger: Pino.Logger;
  const store: Store;
  const createDynamicDatasource: DynamicDatasourceCreator;
}
