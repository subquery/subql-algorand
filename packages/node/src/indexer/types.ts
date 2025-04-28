// Copyright 2020-2025 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import { AlgorandBlock, AlgorandTransaction } from '@subql/types-algorand';

export type BlockContent = AlgorandBlock;

export function getBlockSize(block: BlockContent): number {
  return (
    block.transactions?.reduce(
      (acc, tx) => acc + countInnerTransactions(tx),
      0,
    ) ?? 0
  );
}

function countInnerTransactions(tx: AlgorandTransaction): number {
  return (
    tx.innerTxns?.reduce((acc, itx) => acc + countInnerTransactions(itx), 1) ??
    1
  );
}
