// Copyright 2020-2024 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import {SafeAPI} from './interfaces';
import '@subql/types-core/dist/global';

declare global {
  const api: SafeAPI;
}
