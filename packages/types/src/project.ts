// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type {Indexer} from 'algosdk';
import {AlgorandBlock, AlgorandTransaction} from './interfaces';

export enum AlgorandDataSourceKind {
  Runtime = 'algorand/Runtime',
}

export enum AlgorandHandlerKind {
  Block = 'algorand/BlockHandler',
  Transaction = 'algorand/TransactionHandler',
}

export type RuntimeHandlerInputMap = {
  [AlgorandHandlerKind.Block]: AlgorandBlock;
  [AlgorandHandlerKind.Transaction]: AlgorandTransaction;
};

type RuntimeFilterMap = {
  [AlgorandHandlerKind.Block]: {};
  [AlgorandHandlerKind.Transaction]: AlgorandTransactionFilter;
};

export interface ProjectManifest {
  specVersion: string;
  description: string;
  repository: string;

  schema: string;

  network: {
    endpoint: string;
  };

  dataSources: AlgorandDataSource[];
  bypassBlocks?: number[];
}

// [startSpecVersion?, endSpecVersion?] closed range
export type SpecVersionRange = [number, number];

interface AlgorandBaseHandlerFilter {
  specVersion?: SpecVersionRange;
}

export interface AlgorandBlockFilter extends AlgorandBaseHandlerFilter {
  modulo?: number;
  timestamp?: string;
}

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
export type AlgorandRuntimeHandlerFilter = AlgorandBlockFilter | AlgorandTransactionFilter;

export interface AlgorandMapping<T extends AlgorandHandler = AlgorandHandler> extends FileReference {
  handlers: T[];
}

interface IAlgorandDataSource<M extends AlgorandMapping> {
  name?: string;
  kind: string;
  startBlock?: number;
  mapping: M;
}

export interface AlgorandRuntimeDataSource<
  M extends AlgorandMapping<AlgorandRuntimeHandler> = AlgorandMapping<AlgorandRuntimeHandler>
> extends IAlgorandDataSource<M> {
  kind: AlgorandDataSourceKind.Runtime;
}

export type AlgorandDataSource = AlgorandRuntimeDataSource | AlgorandCustomDataSource;

export interface FileReference {
  file: string;
}

export type CustomDataSourceAsset = FileReference;

export type Processor<O = any> = FileReference & {options?: O};

export interface AlgorandCustomDataSource<
  K extends string = string,
  M extends AlgorandMapping = AlgorandMapping<AlgorandCustomHandler>,
  O = any
> extends IAlgorandDataSource<M> {
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
  (input: RuntimeHandlerInputMap[T], ds: DS, api: Indexer, assets?: Record<string, string>): Promise<E>; //  | SubstrateBuiltinDataSource
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
    api: Indexer;
    assets?: Record<string, string>;
  }): Promise<E[]>; //  | SubstrateBuiltinDataSource
}

type SecondLayerHandlerProcessorArray<
  K extends string,
  T,
  DS extends AlgorandCustomDataSource<K> = AlgorandCustomDataSource<K>
> = SecondLayerHandlerProcessor<AlgorandHandlerKind, T, DS>;

export interface AlgorandDataSourceProcessor<
  K extends string,
  DS extends AlgorandCustomDataSource<K> = AlgorandCustomDataSource<K>,
  P extends Record<string, SecondLayerHandlerProcessorArray<K, any, DS>> = Record<
    string,
    SecondLayerHandlerProcessorArray<K, any, DS>
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
  matcher?: string; // defaults to "equalTo", use "contains" for JSON
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
