// Copyright 2020-2024 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import {
  BaseTemplateDataSource,
  IProjectNetworkConfig,
  CommonSubqueryProject,
  FileReference,
  ProjectManifestV1_0_0,
  BlockFilter,
  BaseHandler,
  BaseMapping,
  BaseDataSource,
  BaseCustomDataSource,
  SecondLayerHandlerProcessor_0_0_0,
  SecondLayerHandlerProcessor_1_0_0,
  DsProcessor,
} from '@subql/types-core';
import type {Indexer, TransactionType} from 'algosdk';
import {AlgorandBlock, AlgorandTransaction} from './interfaces';

export type RuntimeDatasourceTemplate = BaseTemplateDataSource<AlgorandRuntimeDataSource>;
export type CustomDatasourceTemplate = BaseTemplateDataSource<AlgorandCustomDataSource>;

export type AlgorandProjectManifestV1_0_0 = ProjectManifestV1_0_0<AlgorandRuntimeDataSource | AlgorandCustomDataSource>;

/**
 * Kind of Algorand datasource.
 * @enum {string}
 */
export enum AlgorandDataSourceKind {
  /**
   * The runtime kind of Algorand datasource.
   */
  Runtime = 'algorand/Runtime',
}

/**
 * Enum representing the kind of Algorand handler.
 * @enum {string}
 */
export enum AlgorandHandlerKind {
  /**
   * Handler for Algorand blocks.
   */
  Block = 'algorand/BlockHandler',
  /**
   * Handler for Algorand transactions.
   */
  Transaction = 'algorand/TransactionHandler',
}

export type RuntimeHandlerInputMap = {
  [AlgorandHandlerKind.Block]: AlgorandBlock;
  [AlgorandHandlerKind.Transaction]: AlgorandTransaction;
};

export type AlgorandBlockFilter = BlockFilter;

/**
 * Represents a filter for Algorand transactions.
 * Depending on the txType the other filters may or may not be relevant
 * */
export interface AlgorandTransactionFilter {
  /**
   * The type of transaction
   * @example
   * txType: 'axfer',
   * @example
   * txType: 'appl',
   * */
  txType?: TransactionType | string;
  /**
   * Filter by the sender of a transction
   * @example
   * sender: '5GMADASEGJ324HR4GI2XZ2BNSN77ND45LLF4F4XDTAYX3YM6TX5YEU4FEA'
   * */
  sender?: string;
  /**
   * Filter by the receiver of a transaction
   * @example
   * receiver: 'V6CK3HRC4JBRBDIBB4JWOBMYNUYIP7SYHRPVHH5ZMJQME337C57IBIZVFI',
   * */
  receiver?: string;
  nonParticipant?: boolean;
  /**
   * Filter by the assetId of a transaction
   * */
  assetId?: number;
  newFreezeStatus?: boolean;
  address?: string;
  /**
   * Filter by the application id
   * @example
   * applicationId: 971368268,
   * */
  applicationId?: number;
  /**
   * Filter by the args of an application call
   * @example
   * applicationArgs: ['udVC+w=='],
   * @example
   * // Use null to skip filtering certain arguments
   * applicationArgs: ['udVC+w==', null, null, null, 'AQ==']
   * */
  applicationArgs?: string[];
}

/**
 * Represents a handler for Algorand blocks.
 * @type {AlgorandCustomHandler<AlgorandHandlerKind.Block, AlgorandBlockFilter>}
 */
export type AlgorandBlockHandler = AlgorandCustomHandler<AlgorandHandlerKind.Block, AlgorandBlockFilter>;
/**
 * Represents a handler for Algorand transactions.
 * @type {AlgorandCustomHandler<AlgorandHandlerKind.Transaction, AlgorandTransactionFilter>}
 */
export type AlgorandTransactionHandler = AlgorandCustomHandler<
  AlgorandHandlerKind.Transaction,
  AlgorandTransactionFilter
>;

/**
 * Represents a generic custom handler for Algorand.
 * @interface
 * @template K - The kind of the handler (default: string).
 * @template F - The filter type for the handler (default: Record<string, unknown>).
 */
export interface AlgorandCustomHandler<K extends string = string, F = Record<string, unknown>>
  extends BaseHandler<F, K> {
  /**
   * The kind of handler. For `algorand/Runtime` datasources this is either `Block` or `Transaction` kinds.
   * The value of this will determine the filter options as well as the data provided to your handler function
   * @type {AlgorandHandlerKind.Block | AlgorandHandlerKind.Transaction | string }
   * @example
   * kind: AlgorandHandlerKind.Block // Defined with an enum, this is used for runtime datasources
   */
  kind: K;
  /**
   * @type {F}
   * @example
   * filter: {
        txType: 'axfer',
        assetId: 27165954,
        sender: 'ZW3ISEHZUHPO7OZGMKLKIIMKVICOUDRCERI454I3DB2BH52HGLSO67W754',
      }
   */
  filter?: F;
}

/**
 * Represents a runtime handler for Algorand, which can be a block handler or transaction handler.
 * @type {AlgorandBlockHandler | AlgorandTransactionHandler}
 */
export type AlgorandRuntimeHandler = AlgorandBlockHandler | AlgorandTransactionHandler;
/**
 * Represents a handler for Algorand, which can be a runtime handler or a custom handler with unknown filter type.
 * @type {AlgorandRuntimeHandler | AlgorandCustomHandler<string, unknown>}
 */
export type AlgorandHandler = AlgorandRuntimeHandler | AlgorandCustomHandler<string, unknown>;
/**
 * Represents a filter for Algorand runtime handlers, which can be a block filter or transaction filter.
 * @type {AlgorandBlockFilter | AlgorandTransactionFilter}
 */
export type AlgorandRuntimeHandlerFilter = AlgorandBlockFilter | AlgorandTransactionFilter;

/**
 * Represents a mapping for Algorand handlers, extending FileReference.
 * @interface
 * @extends {FileReference}
 */
export interface AlgorandMapping<T extends AlgorandHandler = AlgorandHandler> extends BaseMapping<T> {
  /**
   * @type {T[]}
   * @example
   * handlers: [{
        kind: AlgorandRuntimeHandler.Transaction,
        handler: 'handleTransfer',
        filter: {
          txType: 'axfer',
          assetId: 27165954,
          sender: 'ZW3ISEHZUHPO7OZGMKLKIIMKVICOUDRCERI454I3DB2BH52HGLSO67W754',
        }
      }]
   */
  handlers: T[];
}

/**
 * Represents a Algorand datasource interface with generic parameters.
 * @interface
 * @template M - The mapping type for the datasource.
 */
type IAlgorandDataSource<M extends AlgorandMapping> = BaseDataSource<AlgorandHandler, M>;

export interface AlgorandRuntimeDataSource<
  M extends AlgorandMapping<AlgorandRuntimeHandler> = AlgorandMapping<AlgorandRuntimeHandler>
> extends IAlgorandDataSource<M> {
  kind: AlgorandDataSourceKind.Runtime;
}

export type AlgorandDataSource = AlgorandRuntimeDataSource | AlgorandCustomDataSource;

export type CustomDataSourceAsset = FileReference;

export interface AlgorandCustomDataSource<
  K extends string = string,
  M extends AlgorandMapping = AlgorandMapping<AlgorandCustomHandler>
> extends BaseCustomDataSource<AlgorandHandler, M> {
  /**
   * The kind of the custom datasource. This should follow the pattern `algorand/*`.
   * @type {K}
   */
  kind: K;
}

export type SecondLayerHandlerProcessor<
  K extends AlgorandHandlerKind,
  F extends Record<string, unknown>,
  E,
  DS extends AlgorandCustomDataSource = AlgorandCustomDataSource
> =
  | SecondLayerHandlerProcessor_0_0_0<RuntimeHandlerInputMap, K, F, E, DS, Indexer>
  | SecondLayerHandlerProcessor_1_0_0<RuntimeHandlerInputMap, K, F, E, DS, Indexer>;

type SecondLayerHandlerProcessorArray<
  K extends string,
  F extends Record<string, unknown>,
  T,
  DS extends AlgorandCustomDataSource<K> = AlgorandCustomDataSource<K>
> =
  | SecondLayerHandlerProcessor<AlgorandHandlerKind.Block, F, T, DS>
  | SecondLayerHandlerProcessor<AlgorandHandlerKind.Transaction, F, T, DS>;

export type AlgorandDataSourceProcessor<
  K extends string,
  DS extends AlgorandCustomDataSource<K> = AlgorandCustomDataSource<K>,
  P extends Record<string, SecondLayerHandlerProcessorArray<K, any, DS>> = Record<
    string,
    SecondLayerHandlerProcessorArray<K, any, DS>
  >
> = DsProcessor<DS, P, Indexer>;

export type AlgorandProject<DS extends AlgorandDataSource = AlgorandRuntimeDataSource> = CommonSubqueryProject<
  IProjectNetworkConfig,
  AlgorandRuntimeDataSource | DS,
  BaseTemplateDataSource<AlgorandRuntimeDataSource> | BaseTemplateDataSource<DS>
>;
