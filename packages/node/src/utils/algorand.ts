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
} from '@subql/types';
import { Indexer, TransactionType } from 'algosdk';
import { merge, range } from 'lodash';
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
  if (!filter) return true;

  let validate = true;

  if (filter.txType) {
    switch (txn.txType) {
      case TransactionType.pay:
        validate = validate && checkTypePay(txn, filter);
        break;
      case TransactionType.keyreg:
        validate = validate && checkTypeKeyreg(txn, filter);
        break;
      case TransactionType.afrz:
        validate = validate && checkTypeAssetFreeze(txn, filter);
        break;
      case TransactionType.appl:
        validate = validate && checkTypeApplication(txn, filter);
        break;
      case TransactionType.axfer:
        validate = validate && checkTypeAssetTranfer(txn, filter);
        break;
      case TransactionType.acfg:
        validate = validate && checkTypeApplicationConfig(txn, filter);
        break;
      default:
        validate = false;
        break;
    }
  }

  return validate;
}

function checkTypePay(
  txn: AlgorandTransaction,
  filter?: AlgorandTxTypePayFilter,
): boolean {
  if (!filter) return true;
  let validate = true;

  if (filter.sender) validate = validate && filter.sender === txn.sender;

  if (filter.receiver) {
    validate = validate && filter.receiver === txn.paymentTransaction.receiver;
  }
  return validate;
}

function checkTypeKeyreg(
  txn: AlgorandTransaction,
  filter?: AlgorandTxTypeKeyregFilter,
): boolean {
  if (!filter) return true;
  let validate = true;

  if (filter.nonParticipant) {
    validate =
      validate &&
      filter.nonParticipant === txn.keyregTransaction.nonParticipation;
  }
  return validate;
}

function checkTypeApplicationConfig(
  txn: AlgorandTransaction,
  filter?: AlgorandTxTypeApplicationConfigFilter,
): boolean {
  if (!filter) return true;
  let validate = true;

  if (filter.assetId) {
    validate =
      validate && filter.assetId === txn.assetConfigTransaction.assetId;
  }
  return validate;
}

function checkTypeAssetTranfer(
  txn: AlgorandTransaction,
  filter?: AlgorandTxTypeAssetTransferFilter,
): boolean {
  if (!filter) return true;
  let validate = true;
  if (filter.assetId) {
    validate =
      validate && filter.assetId === txn.assetTransferTransaction.assetId;
  }
  if (filter.sender) {
    validate = validate && filter.sender === txn.sender;
  }
  if (filter.receiver) {
    validate =
      validate && filter.receiver === txn.assetTransferTransaction.receiver;
  }

  return validate;
}

function checkTypeAssetFreeze(
  txn: AlgorandTransaction,
  filter?: AlgorandTxTypeAssetFreezeFilter,
): boolean {
  if (!filter) return true;
  let validate = true;
  if (filter.assetId) {
    validate =
      validate && txn.assetFreezeTransaction.assetId === filter.assetId;
  }
  if (filter.newFreezeStatus) {
    validate = validate && txn.assetFreezeTransaction.newFreezeStatus;
  }
  if (filter.address) validate = validate && txn.sender === filter.address;
  return validate;
}

function checkTypeApplication(
  txn: AlgorandTransaction,
  filter?: AlgorandTxTypeApplicationFilter,
): boolean {
  if (!filter) return true;
  let validate = true;
  if (filter.applicationId) {
    validate =
      validate &&
      filter.applicationId === txn.applicationTransaction.applicationId;
  }
  if (filter.onCompletion) {
    validate =
      validate &&
      filter.onCompletion === txn.applicationTransaction.onCompletion;
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

/**
 *
 * @param api
 * @param startHeight
 * @param endHeight
 * @param overallSpecVer exists if all blocks in the range have same parant specVersion
 */
//Deprecated
// export async function fetchBlocks(
//   api: ApiPromise,
//   startHeight: number,
//   endHeight: number,
//   overallSpecVer?: number,
// ): Promise<BlockContent[]> {
//   const blocks = await fetchBlocksRange(api, startHeight, endHeight);
//   const blockHashs = blocks.map((b) => b.block.header.hash);
//   const parentBlockHashs = blocks.map((b) => b.block.header.parentHash);
//   const [blockEvents, runtimeVersions] = await Promise.all([
//     fetchEventsRange(api, blockHashs),
//     overallSpecVer
//       ? undefined
//       : fetchRuntimeVersionRange(api, parentBlockHashs),
//   ]);
//   return blocks.map((block, idx) => {
//     const events = blockEvents[idx];
//     const parentSpecVersion = overallSpecVer
//       ? overallSpecVer
//       : runtimeVersions[idx].specVersion.toNumber();

//     const wrappedBlock = wrapBlock(block, events.toArray(), parentSpecVersion);
//     const wrappedExtrinsics = wrapExtrinsics(wrappedBlock, events);
//     const wrappedEvents = wrapEvents(wrappedExtrinsics, events, wrappedBlock);
//     return {
//       block: wrappedBlock,
//       extrinsics: wrappedExtrinsics,
//       events: wrappedEvents,
//     };
//   });
// }

// export async function fetchBlocksViaRangeQuery(
//   api: ApiPromise,
//   startHeight: number,
//   endHeight: number,
// ): Promise<BlockContent[]> {
//   const blocks = await fetchBlocksRange(api, startHeight, endHeight);
//   const firstBlockHash = blocks[0].block.header.hash;
//   const endBlockHash = last(blocks).block.header.hash;
//   const [blockEvents, runtimeUpgrades] = await Promise.all([
//     api.query.system.events.range([firstBlockHash, endBlockHash]),
//     api.query.system.lastRuntimeUpgrade.range([firstBlockHash, endBlockHash]),
//   ]);

//   let lastEvents: Vec<EventRecord>;
//   let lastRuntimeUpgrade: Option<LastRuntimeUpgradeInfo>;
//   return blocks.map((block, idx) => {
//     const [, events = lastEvents] = blockEvents[idx] ?? [];
//     const [, runtimeUpgrade = lastRuntimeUpgrade] = runtimeUpgrades[idx] ?? [];
//     lastEvents = events;
//     lastRuntimeUpgrade = runtimeUpgrade;

//     const wrappedBlock = wrapBlock(
//       block,
//       events,
//       runtimeUpgrade.unwrap()?.specVersion.toNumber(),
//     );
//     const wrappedExtrinsics = wrapExtrinsics(wrappedBlock, events);
//     const wrappedEvents = wrapEvents(wrappedExtrinsics, events, wrappedBlock);
//     return {
//       block: wrappedBlock,
//       extrinsics: wrappedExtrinsics,
//       events: wrappedEvents,
//     };
//   });
// }

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

// export async function fetchEventsRange(
//   api: ApiPromise,
//   hashs: BlockHash[],
// ): Promise<Vec<EventRecord>[]> {
//   return Promise.all(
//     hashs.map((hash) =>
//       api.query.system.events.at(hash).catch((e) => {
//         logger.error(`failed to fetch events at block ${hash}`);
//         throw e;
//       }),
//     ),
//   );
// }

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
