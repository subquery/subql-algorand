// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {RegisteredTypes, RegistryTypes, OverrideModuleType, OverrideBundleType} from '@polkadot/types/types';

import {BaseMapping, FileReference} from '@subql/common';
import {
  CustomDataSourceAsset as AlgorandCustomDataSourceAsset,
  AlgorandBlockFilter,
  AlgorandBlockHandler,
  AlgorandCustomHandler,
  AlgorandDataSourceKind,
  AlgorandHandlerKind,
  AlgorandNetworkFilter,
  AlgorandRuntimeDataSource,
  AlgorandRuntimeHandler,
  AlgorandRuntimeHandlerFilter,
  AlgorandCustomDataSource,
  AlgorandTransactionHandler,
  AlgorandTransactionFilter,
} from '@subql/types';
import {plainToClass, Transform, Type} from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsObject,
  ValidateNested,
  IsNumber,
} from 'class-validator';

export class BlockFilter implements AlgorandBlockFilter {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(2)
  specVersion?: [number, number];
}

export class TransactionFilter implements AlgorandTransactionFilter {
  @IsString()
  @IsOptional()
  txType?: string;

  @IsString()
  @IsOptional()
  sender?: string;

  @IsString()
  @IsOptional()
  receiver?: string;

  @IsBoolean()
  @IsOptional()
  nonParticipant?: boolean;

  @IsString()
  @IsOptional()
  assetId?: number;

  @IsBoolean()
  @IsOptional()
  newFreezeStatus?: boolean;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber()
  @IsOptional()
  applicationId?: number;
}

export class ChainTypes implements RegisteredTypes {
  @IsObject()
  @IsOptional()
  types?: RegistryTypes;

  @IsObject()
  @IsOptional()
  typesAlias?: Record<string, OverrideModuleType>;

  @IsObject()
  @IsOptional()
  typesBundle?: OverrideBundleType;

  @IsObject()
  @IsOptional()
  typesChain?: Record<string, RegistryTypes>;

  @IsObject()
  @IsOptional()
  typesSpec?: Record<string, RegistryTypes>;
}

export class BlockHandler implements AlgorandBlockHandler {
  @IsOptional()
  @ValidateNested()
  @Type(() => BlockFilter)
  filter?: AlgorandBlockFilter;

  @IsEnum(AlgorandHandlerKind, {groups: [AlgorandHandlerKind.Block]})
  kind: AlgorandHandlerKind.Block;

  @IsString()
  handler: string;
}

export class TransactionHandler implements AlgorandTransactionHandler {
  @IsOptional()
  @ValidateNested()
  @Type(() => TransactionFilter)
  filter?: TransactionFilter;

  @IsEnum(AlgorandHandlerKind, {groups: [AlgorandHandlerKind.Block]})
  kind: AlgorandHandlerKind.Transaction;

  @IsString()
  handler: string;
}

export class CustomHandler implements AlgorandCustomHandler {
  @IsString()
  kind: string;

  @IsString()
  handler: string;

  @IsObject()
  @IsOptional()
  filter?: Record<string, unknown>;
}

export class RuntimeMapping implements BaseMapping<AlgorandRuntimeHandlerFilter, AlgorandRuntimeHandler> {
  @Transform((params) => {
    const handlers: AlgorandRuntimeHandler[] = params.value;
    return handlers.map((handler) => {
      switch (handler.kind) {
        case AlgorandHandlerKind.Block:
          return plainToClass(BlockHandler, handler);
        case AlgorandHandlerKind.Transaction:
          return plainToClass(TransactionHandler, handler);
        default:
          throw new Error(`handler ${(handler as any).kind} not supported`);
      }
    });
  })
  @IsArray()
  @ValidateNested()
  handlers: AlgorandRuntimeHandler[];

  @IsString()
  file: string;
}

export class CustomMapping implements BaseMapping<Record<string, unknown>, AlgorandCustomHandler> {
  @IsArray()
  @Type(() => CustomHandler)
  @ValidateNested()
  handlers: CustomHandler[];

  @IsString()
  file: string;
}

export class SubqlNetworkFilterImpl implements AlgorandNetworkFilter {
  @IsString()
  @IsOptional()
  specName?: string;
}

export class RuntimeDataSourceBase implements AlgorandRuntimeDataSource {
  @IsEnum(AlgorandDataSourceKind, {groups: [AlgorandDataSourceKind.Runtime]})
  kind: AlgorandDataSourceKind.Runtime;

  @Type(() => RuntimeMapping)
  @ValidateNested()
  mapping: RuntimeMapping;

  @IsOptional()
  @IsInt()
  startBlock?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => SubqlNetworkFilterImpl)
  filter?: AlgorandNetworkFilter;
}

export class FileReferenceImpl implements FileReference {
  @IsString()
  file: string;
}

export class CustomDataSourceBase<K extends string, T extends AlgorandNetworkFilter, M extends CustomMapping, O = any>
  implements AlgorandCustomDataSource<K, T, M, O>
{
  @IsString()
  kind: K;

  @Type(() => CustomMapping)
  @ValidateNested()
  mapping: M;

  @IsOptional()
  @IsInt()
  startBlock?: number;

  @Type(() => FileReferenceImpl)
  @ValidateNested({each: true})
  assets: Map<string, AlgorandCustomDataSourceAsset>;

  @Type(() => FileReferenceImpl)
  @IsObject()
  processor: FileReference;

  @IsOptional()
  @IsObject()
  filter?: T;
}
