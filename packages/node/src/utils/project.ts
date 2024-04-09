// Copyright 2020-2024 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import {
  AlgorandRuntimeHandler,
  AlgorandCustomHandler,
  AlgorandHandler,
  AlgorandHandlerKind,
} from '@subql/common-algorand';

export function isBaseHandler(
  handler: AlgorandHandler,
): handler is AlgorandRuntimeHandler {
  return Object.values<string>(AlgorandHandlerKind).includes(handler.kind);
}

export function isCustomHandler(
  handler: AlgorandHandler,
): handler is AlgorandCustomHandler {
  return !isBaseHandler(handler);
}
