// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

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
