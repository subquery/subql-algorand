// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {BaseMapping, ProjectManifestBaseImpl} from '@subql/common';
import {AlgorandNetworkFilter} from '@subql/common-substrate';
import {AlgorandCustomDataSource} from '@subql/types';
import {plainToClass, Type} from 'class-transformer';
import {Equals, IsArray, IsObject, IsOptional, IsString, ValidateNested, validateSync} from 'class-validator';
import yaml from 'js-yaml';
import {CustomDataSourceBase, RuntimeDataSourceBase} from '../../models';
import {CustomDataSourceV0_0_1, ProjectManifestV0_0_1, RuntimeDataSourceV0_0_1} from './types';

export class FileType {
  @IsString()
  file: string;
}

export class ProjectNetworkDeploymentV0_0_1 {
  @IsString()
  chainId: string;
}

export class ProjectNetworkV0_0_1 extends ProjectNetworkDeploymentV0_0_1 {
  @IsString()
  endpoint: string;
  @IsString()
  @IsOptional()
  dictionary?: string;
  @IsString()
  @IsOptional()
  genesisHash?: string;
}

function validateObject(object: any, errorMessage = 'failed to validate object.'): void {
  const errors = validateSync(object, {whitelist: true, forbidNonWhitelisted: true});
  if (errors?.length) {
    // TODO: print error details
    const errorMsgs = errors.map((e) => e.toString()).join('\n');
    throw new Error(`${errorMessage}\n${errorMsgs}`);
  }
}

export class AlgorandRuntimeDataSourceV0_0_1Impl extends RuntimeDataSourceBase implements RuntimeDataSourceV0_0_1 {
  validate(): void {
    return validateObject(this, 'failed to validate runtime datasource.');
  }
}

export class AlgorandCustomDataSourceV0_0_1Impl<
    K extends string = string,
    T extends AlgorandNetworkFilter = AlgorandNetworkFilter,
    M extends BaseMapping<any, any> = BaseMapping<Record<string, unknown>, any>
  >
  extends CustomDataSourceBase<K, T, M>
  implements AlgorandCustomDataSource<K, T, M>
{
  validate(): void {
    return validateObject(this, 'failed to validate custom datasource.');
  }
}

export class DeploymentV0_0_1 {
  @Equals('0.0.1')
  @IsString()
  specVersion: string;
  @ValidateNested()
  @Type(() => FileType)
  schema: FileType;
  @IsArray()
  @ValidateNested()
  @Type(() => AlgorandCustomDataSourceV0_0_1Impl, {
    discriminator: {
      property: 'kind',
      subTypes: [{value: AlgorandRuntimeDataSourceV0_0_1Impl, name: 'algorand/Runtime'}],
    },
    keepDiscriminatorProperty: true,
  })
  dataSources: (RuntimeDataSourceV0_0_1 | CustomDataSourceV0_0_1)[];
  @ValidateNested()
  @Type(() => ProjectNetworkDeploymentV0_0_1)
  network: ProjectNetworkDeploymentV0_0_1;
}

export class ProjectManifestV0_0_1Impl
  extends ProjectManifestBaseImpl<DeploymentV0_0_1>
  implements ProjectManifestV0_0_1
{
  @Equals('0.0.1')
  specVersion: string;
  @IsString()
  name: string;
  @IsString()
  version: string;
  @IsObject()
  @ValidateNested()
  @Type(() => ProjectNetworkV0_0_1)
  network: ProjectNetworkV0_0_1;
  schema: FileType;
  @IsArray()
  @ValidateNested()
  @Type(() => AlgorandCustomDataSourceV0_0_1Impl, {
    discriminator: {
      property: 'kind',
      subTypes: [{value: AlgorandRuntimeDataSourceV0_0_1Impl, name: 'algorand/Runtime'}],
    },
    keepDiscriminatorProperty: true,
  })
  dataSources: (RuntimeDataSourceV0_0_1 | CustomDataSourceV0_0_1)[];
  private _deployment: DeploymentV0_0_1;

  toDeployment(): string {
    return yaml.dump(this._deployment, {
      sortKeys: true,
      condenseFlow: true,
    });
  }

  get deployment(): DeploymentV0_0_1 {
    if (!this._deployment) {
      this._deployment = plainToClass(DeploymentV0_0_1, this);
      validateSync(this._deployment, {whitelist: true});
    }
    return this._deployment;
  }

  validate(): void {
    const errors = validateSync(this.deployment, {whitelist: true, forbidNonWhitelisted: true});
    if (errors?.length) {
      // TODO: print error details
      const errorMsgs = errors.map((e) => e.toString()).join('\n');
      throw new Error(`failed to parse project.yaml.\n${errorMsgs}`);
    }
  }
}
