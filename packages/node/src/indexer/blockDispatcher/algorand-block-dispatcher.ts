// Copyright 2020-2025 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import { IBlockDispatcher } from '@subql/node-core';
import { AlgorandBlock } from '@subql/types-algorand';

export interface IAlgorandBlockDispatcher
  extends IBlockDispatcher<AlgorandBlock> {
  init(
    onDynamicDsCreated: (height: number) => Promise<void> | void,
  ): Promise<void>;
}
