// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {ApiPromise} from '@polkadot/api';
import {RegistryTypes} from '@polkadot/types/types';
import {Indexer, TransactionType} from 'algosdk';
import {SubstrateBlock} from './interfaces';

export enum AlgorandDataSourceKind {
  Runtime = 'algorand/Runtime',
}

export enum AlgorandHandlerKind {
  Block = 'algorand/BlockHandler',
  Transaction = 'algorand/TransactionHandler',
}

export type RuntimeHandlerInputMap = {
  [AlgorandHandlerKind.Block]: SubstrateBlock;
  [AlgorandHandlerKind.Transaction]: any;
};

type RuntimeFilterMap = {
  [AlgorandHandlerKind.Block]: AlgorandNetworkFilter;
  [AlgorandHandlerKind.Transaction]: any;
};

export interface ProjectManifest {
  specVersion: string;
  description: string;
  repository: string;

  schema: string;

  network: {
    endpoint: string;
    customTypes?: RegistryTypes;
  };

  dataSources: AlgorandDataSource[];
}

// [startSpecVersion?, endSpecVersion?] closed range
export type SpecVersionRange = [number, number];

interface AlgorandBaseHandlerFilter {
  specVersion?: string;
}

export type AlgorandBlockFilter = AlgorandBaseHandlerFilter;

export interface AlgorandTransactionFilter {
  txType?: string;
  sender?: string;
  receiver?: string;
  nonParticipant?: boolean;
  assetId?: number;
  newFreezeStatus?: boolean;
  address?: string;
  applicationId?: number;
}

export type AlgorandBlockHandler = AlgorandCustomHandler<AlgorandHandlerKind.Block, AlgorandBlockFilter>;
export type AlgorandTransactionHandler = AlgorandCustomHandler<
  AlgorandHandlerKind.Transaction,
  AlgorandTransactionFilter
>;

export interface AlgorandCustomHandler<K extends string = string, F = Record<string, unknown>> {
  handler: string;
  kind: K;
  filter?: F;
}

export type AlgorandRuntimeHandler = AlgorandBlockHandler | AlgorandTransactionHandler;
export type AlgorandHandler = AlgorandRuntimeHandler | AlgorandCustomHandler<string, unknown>;
export type AlgorandRuntimeHandlerFilter = AlgorandTransactionFilter;

export interface AlgorandMapping<T extends AlgorandHandler = AlgorandHandler> extends FileReference {
  handlers: T[];
}

interface IAlgorandDataSource<M extends AlgorandMapping, F extends AlgorandNetworkFilter = AlgorandNetworkFilter> {
  name?: string;
  kind: string;
  filter?: F;
  startBlock?: number;
  mapping: M;
}

export interface AlgorandRuntimeDataSource<
  M extends AlgorandMapping<AlgorandRuntimeHandler> = AlgorandMapping<AlgorandRuntimeHandler>
> extends IAlgorandDataSource<M> {
  kind: AlgorandDataSourceKind.Runtime;
}

export interface AlgorandNetworkFilter {
  specName?: string;
}

export type AlgorandDataSource = AlgorandRuntimeDataSource | AlgorandCustomDataSource; // | SubstrateBuiltinDataSource;

export interface FileReference {
  file: string;
}

export type CustomDataSourceAsset = FileReference;

export type Processor<O = any> = FileReference & {options?: O};

export interface AlgorandCustomDataSource<
  K extends string = string,
  T extends AlgorandNetworkFilter = AlgorandNetworkFilter,
  M extends AlgorandMapping = AlgorandMapping<AlgorandCustomHandler>,
  O = any
> extends IAlgorandDataSource<M, T> {
  kind: K;
  assets: Map<string, CustomDataSourceAsset>;
  processor: Processor<O>;
}

//export type SubstrateBuiltinDataSource = IAlgorandDataSource;

export interface HandlerInputTransformer_0_0_0<
  T extends AlgorandHandlerKind,
  E,
  DS extends AlgorandCustomDataSource = AlgorandCustomDataSource
> {
  (input: RuntimeHandlerInputMap[T], ds: DS, api: ApiPromise, assets?: Record<string, string>): Promise<E>; //  | SubstrateBuiltinDataSource
}

export interface HandlerInputTransformer_1_0_0<
  T extends AlgorandHandlerKind,
  F,
  E,
  DS extends AlgorandCustomDataSource = AlgorandCustomDataSource
> {
  (params: {
    input: RuntimeHandlerInputMap[T];
    ds: DS;
    filter?: F;
    api: ApiPromise;
    assets?: Record<string, string>;
  }): Promise<E[]>; //  | SubstrateBuiltinDataSource
}

type SecondLayerHandlerProcessorArray<
  K extends string,
  F extends AlgorandNetworkFilter,
  T,
  DS extends AlgorandCustomDataSource<K, F> = AlgorandCustomDataSource<K, F>
> = SecondLayerHandlerProcessor<AlgorandHandlerKind.Block, F, T, DS>;

export interface AlgorandDataSourceProcessor<
  K extends string,
  F extends AlgorandNetworkFilter,
  DS extends AlgorandCustomDataSource<K, F> = AlgorandCustomDataSource<K, F>,
  P extends Record<string, SecondLayerHandlerProcessorArray<K, F, any, DS>> = Record<
    string,
    SecondLayerHandlerProcessorArray<K, F, any, DS>
  >
> {
  kind: K;
  validate(ds: DS, assets: Record<string, string>): void;
  dsFilterProcessor(ds: DS, api: Indexer): boolean;
  handlerProcessors: P;
}

export interface DictionaryQueryCondition {
  field: string;
  value: string;
}

export interface DictionaryQueryEntry {
  entity: string;
  conditions: DictionaryQueryCondition[];
}

interface SecondLayerHandlerProcessorBase<
  K extends AlgorandHandlerKind,
  F,
  DS extends AlgorandCustomDataSource = AlgorandCustomDataSource
> {
  baseHandlerKind: K;
  baseFilter: RuntimeFilterMap[K] | RuntimeFilterMap[K][];
  filterValidator: (filter?: F) => void;
  dictionaryQuery?: (filter: F, ds: DS) => DictionaryQueryEntry | undefined;
}

// only allow one custom handler for each baseHandler kind
export interface SecondLayerHandlerProcessor_0_0_0<
  K extends AlgorandHandlerKind,
  F,
  E,
  DS extends AlgorandCustomDataSource = AlgorandCustomDataSource
> extends SecondLayerHandlerProcessorBase<K, F, DS> {
  specVersion: undefined;
  transformer: HandlerInputTransformer_0_0_0<K, E, DS>;
  filterProcessor: (filter: F | undefined, input: RuntimeHandlerInputMap[K], ds: DS) => boolean;
}

export interface SecondLayerHandlerProcessor_1_0_0<
  K extends AlgorandHandlerKind,
  F,
  E,
  DS extends AlgorandCustomDataSource = AlgorandCustomDataSource
> extends SecondLayerHandlerProcessorBase<K, F, DS> {
  specVersion: '1.0.0';
  transformer: HandlerInputTransformer_1_0_0<K, F, E, DS>;
  filterProcessor: (params: {filter: F | undefined; input: RuntimeHandlerInputMap[K]; ds: DS}) => boolean;
}

export type SecondLayerHandlerProcessor<
  K extends AlgorandHandlerKind,
  F,
  E,
  DS extends AlgorandCustomDataSource = AlgorandCustomDataSource
> = SecondLayerHandlerProcessor_0_0_0<K, F, E, DS> | SecondLayerHandlerProcessor_1_0_0<K, F, E, DS>;

export const mappingFilterTransaction = {
  [TransactionType.pay]: {
    sender: 'sender',
    receiver: 'paymentTransaction.receiver',
  },
  [TransactionType.keyreg]: {
    nonParticipant: 'keyregTransaction.nonParticipation',
  },
  [TransactionType.acfg]: {
    assetId: 'assetConfigTransaction.assetId',
  },
  [TransactionType.axfer]: {
    assetId: 'assetTransferTransaction.assetId',
    sender: 'sender',
    receiver: 'assetTransferTransaction.receiver',
  },
  [TransactionType.afrz]: {
    assetId: 'assetFreezeTransaction.assetId',
    newFreezeStatus: 'assetFreezeTransaction.newFreezeStatus',
    address: 'sender',
  },
  [TransactionType.appl]: {
    applicationId: 'applicationTransaction.applicationId',
  },
};
