// Copyright 2020-2025 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import type {TransactionType, Indexer} from 'algosdk';

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

export interface AlgorandTransaction {
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
  innerTxns?: AlgorandTransaction[];
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
  txType: TransactionType;
  block: AlgorandBlock;
}

export interface AlgorandBlock {
  hash: string;
  genesisHash: string;
  genesisId: string;
  previousBlockHash: string;
  rewards?: BlockReward[];
  round: number;
  seed: string;
  timestamp: number;
  transactions?: AlgorandTransaction[];
  transactionsRoot: string;
  txnCounter?: number;
  upgradeState?: BlockUpgradeState;
  upgradeVote?: BlockUpgradeVote;
  getTransactionsByGroup: (groupId: string) => AlgorandTransaction[];
}

export type SafeAPI = {
  indexer: Indexer;
  getBlock(): Promise<AlgorandBlock>;
  getTxns(): Promise<AlgorandTransaction[]>;
};
