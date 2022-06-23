// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {Extrinsic, EventRecord, SignedBlock} from '@polkadot/types/interfaces';

export interface Entity {
  id: string;
}

export type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

export interface Store {
  get(entity: string, id: string): Promise<Entity | null>;
  getByField(entity: string, field: string, value: any): Promise<Entity[]>;
  getOneByField(entity: string, field: string, value: any): Promise<Entity | null>;
  set(entity: string, id: string, data: Entity): Promise<void>;
  bulkCreate(entity: string, data: Entity[]): Promise<void>;
  remove(entity: string, id: string): Promise<void>;
}

export interface SubstrateBlock extends SignedBlock {
  // parent block's spec version, can be used to decide the correct metadata that should be used for this block.
  specVersion: number;
  timestamp: Date;
  events: EventRecord[];
}

export interface SubstrateExtrinsic {
  // index in the block
  idx: number;
  extrinsic: Extrinsic;
  block: SubstrateBlock;
  events: EventRecord[];
  success: boolean;
}

export interface SubstrateEvent extends EventRecord {
  // index in the block
  idx: number;
  extrinsic?: SubstrateExtrinsic;
  block: SubstrateBlock;
}

export type DynamicDatasourceCreator = (name: string, args: Record<string, unknown>) => Promise<void>;

export enum ETransactionType {
  pay = 'pay',
  keyreg = 'keyreg',
  acfg = 'acfg',
  axfer = 'axfer',
  afrz = 'afrz',
  appl = 'appl',
}

export enum EOnCompletion {
  noop = 'noop',
  optin = 'optin',
  closeout = 'closeout',
  clear = 'clear',
  update = 'update',
  delete = 'delete',
}

export interface BlockReward {
  feeSink: string;
  rewardsCalculationRound: number;
  rewardsLevel: number;
  rewardsPool: string;
  rewardsRate: string;
  rewardsResidue: number;
}

export interface StateSchema {
  numByteSlice: number;
  numUint: number;
}

export interface EvalDelta {
  action: number;
  bytes?: string;
  uint?: number;
}

export interface EvalDeltaKeyValue {
  key: string;
  value: EvalDelta;
}

export interface TransactionAssetParam {
  clawback?: string;
  creator: string;
  decimals: number;
  defaultFrozen?: boolean;
  freeze?: string;
  manager?: string;
  metadataHash?: string;
  name?: string;
  nameB64?: string;
  reserve?: string;
  total: number;
  unitName?: string;
  unitNameB64?: string;
  url?: string;
  urlB64?: string;
}

export interface TransactionApplication {
  accounts?: string[];
  applicationArgs?: string[];
  applicationId: number;
  approvalProgram?: string;
  clearStateProgram?: string;
  extraProgramPages?: number;
  foreignApps?: number[];
  foreignAssets?: number[];
  globalStateSchema?: StateSchema;
  localStateSchema?: StateSchema;
  onCompletion: EOnCompletion;
}

export interface TransactionAssetConfig {
  assetId?: number;
  params?: TransactionAssetParam;
}

export interface TransactionAssetFreeze {
  address: string;
  assetId: number;
  newFreezeStatus: boolean;
}

export interface TransactionAssetTransfer {
  amount: number;
  assetId: number;
  closeAmount?: number;
  closeTo?: string;
  receiver: string;
  sender?: string;
}

export interface TransactionKeyreg {
  nonParticipation?: boolean;
  selectionParticipationKey?: string;
  stateProofKey?: string;
  voteFirstValid?: number;
  voteKeyDilution?: number;
  voteLastValid?: number;
  voteParticipationKey?: string;
}

export interface TransactionPayment {
  amount: number;
  closeAmount?: number;
  closeRemainderTo?: string;
  receiver: string;
}

export interface TransactionSignatureMultisigSubsignature {
  publicKey?: string;
  signature?: string;
}

export interface TransactionSignatureMultisig {
  subsignature?: TransactionSignatureMultisigSubsignature[];
  threshold?: number;
  version?: number;
}

export interface TransactionSignatureLogicsig {
  args?: string[];
  logic: string;
  multisigSignature?: TransactionSignatureMultisig;
  signature?: string;
}

export interface TransactionSignature {
  logicsig?: TransactionSignatureLogicsig;
  multisig?: TransactionSignatureMultisig;
  sig?: string;
}

export interface BlockUpgradeState {
  currentProtocol: string;
  nextProtocol?: string;
  nextProtocolApprovals?: number;
  nextProtocolSwitchOn?: number;
  nextProtocolVoteBefore?: number;
}

export interface BlockUpgradeVote {
  upgradeApprove?: boolean;
  upgradeDelay?: number;
  upgradePropose?: string;
}

export interface AlgoTransaction {
  applicationTransaction?: TransactionApplication;
  assetConfigTransaction?: TransactionAssetConfig;
  assetFreezeTransaction?: TransactionAssetFreeze;
  assetTransferTransaction?: TransactionAssetTransfer;
  authAddr?: string;
  closeRewards?: number;
  closingAmount?: number;
  confirmedRound?: number;
  createdApplicationIndex?: number;
  createdAssetIndex?: number;
  fee: number;
  firstValid: number;
  genesisHash?: string;
  genesisId?: string;
  globalStateDelta?: EvalDeltaKeyValue[];
  group?: string;
  id?: string;
  innerTxns?: AlgoTransaction[];
  intraRoundOffset?: number;
  keyregTransaction?: TransactionKeyreg;
  lastValid: number;
  lease?: string;
  localStateDelta?: string[];
  logs?: string[];
  note?: string;
  paymentTransaction?: TransactionPayment;
  receiverRewards?: number;
  rekeyTo?: string;
  roundTime?: number;
  sender: string;
  senderRewards?: number;
  signature?: TransactionSignature;
  txType: ETransactionType;
}

export interface AlgoBlock {
  genesisHash: string;
  genesisId: string;
  previousBlockHash: string;
  rewards?: BlockReward[];
  round: number;
  seed: string;
  timestamp: number;
  transactions?: AlgoTransaction[];
  transactionsRoot: string;
  txnCounter?: number;
  upgradeState?: BlockUpgradeState;
  upgradeVote?: BlockUpgradeVote;
}
