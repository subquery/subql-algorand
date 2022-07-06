// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiPromise } from '@polkadot/api';
import '@polkadot/api-augment/substrate';
import {
  BlockHash,
  EventRecord,
  RuntimeVersion,
  SignedBlock,
} from '@polkadot/types/interfaces';
import {
  SpecVersionRange,
  AlgorandBlockFilter,
  SubstrateBlock,
  SubstrateEvent,
  SubstrateExtrinsic,
  AlgorandBlock,
  AlgorandTransaction,
  AlgorandTransactionFilter,
  AlgorandTxTypeApplicationConfigFilter,
  AlgorandTxTypeApplicationFilter,
  AlgorandTxTypeAssetFreezeFilter,
  AlgorandTxTypeAssetTransferFilter,
  AlgorandTxTypePayFilter,
  AlgorandTxTypeKeyregFilter,
  mappingFilterTransaction,
} from '@subql/types';
import { Indexer, TransactionType } from 'algosdk';
import { get, merge, range } from 'lodash';
import { getLogger } from './logger';
import { camelCaseObjectKey } from './object';
const logger = getLogger('fetch');

export function wrapBlock(
  signedBlock: SignedBlock,
  events: EventRecord[],
  specVersion?: number,
): SubstrateBlock {
  return merge(signedBlock, {
    timestamp: getTimestamp(signedBlock),
    specVersion: specVersion,
    events,
  });
}

function getTimestamp({ block: { extrinsics } }: SignedBlock): Date {
  for (const e of extrinsics) {
    const {
      method: { method, section },
    } = e;
    if (section === 'timestamp' && method === 'set') {
      const date = new Date(e.args[0].toJSON() as number);
      if (isNaN(date.getTime())) {
        throw new Error('timestamp args type wrong');
      }
      return date;
    }
  }
}

export function wrapExtrinsics(
  wrappedBlock: SubstrateBlock,
  allEvents: EventRecord[],
): SubstrateExtrinsic[] {
  return wrappedBlock.block.extrinsics.map((extrinsic, idx) => {
    const events = filterExtrinsicEvents(idx, allEvents);
    return {
      idx,
      extrinsic,
      block: wrappedBlock,
      events,
      success: getExtrinsicSuccess(events),
    };
  });
}

function getExtrinsicSuccess(events: EventRecord[]): boolean {
  return (
    events.findIndex((evt) => evt.event.method === 'ExtrinsicSuccess') > -1
  );
}

function filterExtrinsicEvents(
  extrinsicIdx: number,
  events: EventRecord[],
): EventRecord[] {
  return events.filter(
    ({ phase }) =>
      phase.isApplyExtrinsic && phase.asApplyExtrinsic.eqn(extrinsicIdx),
  );
}

export function wrapEvents(
  extrinsics: SubstrateExtrinsic[],
  events: EventRecord[],
  block: SubstrateBlock,
): SubstrateEvent[] {
  return events.reduce((acc, event, idx) => {
    const { phase } = event;
    const wrappedEvent: SubstrateEvent = merge(event, { idx, block });
    if (phase.isApplyExtrinsic) {
      wrappedEvent.extrinsic = extrinsics[phase.asApplyExtrinsic.toNumber()];
    }
    acc.push(wrappedEvent);
    return acc;
  }, [] as SubstrateEvent[]);
}

function checkSpecRange(
  specVersionRange: SpecVersionRange,
  specVersion: number,
) {
  const [lowerBond, upperBond] = specVersionRange;
  return (
    (lowerBond === undefined ||
      lowerBond === null ||
      specVersion >= lowerBond) &&
    (upperBond === undefined || upperBond === null || specVersion <= upperBond)
  );
}

export function filterBlock(
  block: SubstrateBlock,
  filter?: AlgorandBlockFilter,
): boolean {
  // no filters for block.s
  return true;
}
export function filterTransaction(
  txn: AlgorandTransaction,
  filter?: AlgorandTransactionFilter,
): boolean {
  const { txType, ...filterByKey } = filter;
  let validate = true;
  validate = validate && txn.txType === txType;

  for (const key in filterByKey) {
    validate =
      validate &&
      filterByKey[key] === get(txn, mappingFilterTransaction[txType][key]);
  }

  return validate;
}

// TODO: prefetch all known runtime upgrades at once
export async function prefetchMetadata(
  api: ApiPromise,
  hash: BlockHash,
): Promise<void> {
  await api.getBlockRegistry(hash);
}

async function getBlockByHeight(
  api: Indexer,
  height: number,
): Promise<AlgorandBlock> {
  try {
    const blockInfo = await api.lookupBlock(height).do();
    return camelCaseObjectKey(blockInfo);
  } catch (error) {
    logger.error(`failed to fetch Block at round ${height}`);
    throw error;
  }
}

export async function fetchBlocksRange(
  api: Indexer,
  startHeight: number,
  endHeight: number,
): Promise<any[]> {
  return Promise.all(
    range(startHeight, endHeight + 1).map(async (height) =>
      getBlockByHeight(api, height),
    ),
  );
}

export async function fetchBlocksArray(
  api: Indexer,
  blockArray: number[],
): Promise<any[]> {
  return Promise.all(
    blockArray.map(async (height) => getBlockByHeight(api, height)),
  );
}

export async function fetchRuntimeVersionRange(
  api: ApiPromise,
  hashs: BlockHash[],
): Promise<RuntimeVersion[]> {
  return Promise.all(
    hashs.map((hash) =>
      api.rpc.state.getRuntimeVersion(hash).catch((e) => {
        logger.error(`failed to fetch RuntimeVersion at block ${hash}`);
        throw e;
      }),
    ),
  );
}

export async function fetchBlocksBatches(
  api: Indexer,
  blockArray: number[],
  overallSpecVer?: number,
  // specVersionMap?: number[],
): Promise<any[]> {
  const blocks = await fetchBlocksArray(api, blockArray);
  // const blockHashs = blocks.map((b) => b.block.header.hash);
  // const parentBlockHashs = blocks.map((b) => b.block.header.parentHash);
  // const [blockEvents, runtimeVersions] = await Promise.all([
  //   fetchEventsRange(api, blockHashs),
  //   overallSpecVer
  //     ? undefined
  //     : fetchRuntimeVersionRange(api, parentBlockHashs),
  // ]);
  return blocks;
  // .map((block, idx) => {
  //   const events = blockEvents[idx];
  //   const parentSpecVersion = overallSpecVer
  //     ? overallSpecVer
  //     : runtimeVersions[idx].specVersion.toNumber();
  //   const wrappedBlock = wrapBlock(block, events.toArray(), parentSpecVersion);
  //   const wrappedExtrinsics = wrapExtrinsics(wrappedBlock, events);
  //   const wrappedEvents = wrapEvents(wrappedExtrinsics, events, wrappedBlock);
  //   return {
  //     block: wrappedBlock,
  //     extrinsics: wrappedExtrinsics,
  //     events: wrappedEvents,
  //   };
  // });
}
