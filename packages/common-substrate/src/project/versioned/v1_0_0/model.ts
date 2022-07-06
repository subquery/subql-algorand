// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {BaseMapping, ProjectManifestBaseImpl} from '@subql/common';
import {AlgorandNetworkFilter} from '@subql/common-substrate';
import {AlgorandCustomDataSource} from '@subql/types';
import {plainToClass, Type} from 'class-transformer';
import {Equals, IsArray, IsObject, IsOptional, IsString, ValidateNested, validateSync} from 'class-validator';
import yaml from 'js-yaml';
import {CustomDataSourceBase, RuntimeDataSourceBase} from '../../models';
import {CustomDataSourceV1_0_0, ProjectManifestV1_0_0, RuntimeDataSourceV1_0_0} from './types';

export class FileType {
  @IsString()
  file: string;
}

export class ProjectNetworkDeploymentV1_0_0 {
  @IsString()
  chainId: string;
}

export class ProjectNetworkV1_0_0 extends ProjectNetworkDeploymentV1_0_0 {
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

export class AlgorandRuntimeDataSourceV1_0_0Impl extends RuntimeDataSourceBase implements RuntimeDataSourceV1_0_0 {
  validate(): void {
    return validateObject(this, 'failed to validate runtime datasource.');
  }
}

export class AlgorandCustomDataSourceV1_0_0Impl<
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

export class DeploymentV1_0_0 {
  @Equals('1.0.0')
  @IsString()
  specVersion: string;
  @ValidateNested()
  @Type(() => FileType)
  schema: FileType;
  @IsArray()
  @ValidateNested()
  @Type(() => AlgorandCustomDataSourceV1_0_0Impl, {
    discriminator: {
      property: 'kind',
      subTypes: [{value: AlgorandRuntimeDataSourceV1_0_0Impl, name: 'algorand/Runtime'}],
    },
    keepDiscriminatorProperty: true,
  })
  dataSources: (RuntimeDataSourceV1_0_0 | CustomDataSourceV1_0_0)[];
  @ValidateNested()
  @Type(() => ProjectNetworkDeploymentV1_0_0)
  network: ProjectNetworkDeploymentV1_0_0;
}

export class ProjectManifestV1_0_0Impl
  extends ProjectManifestBaseImpl<DeploymentV1_0_0>
  implements ProjectManifestV1_0_0
{
  @Equals('1.0.0')
  specVersion: string;
  @IsString()
  name: string;
  @IsString()
  version: string;
  @IsObject()
  @ValidateNested()
  @Type(() => ProjectNetworkV1_0_0)
  network: ProjectNetworkV1_0_0;
  schema: FileType;
  @IsArray()
  @ValidateNested()
  @Type(() => AlgorandCustomDataSourceV1_0_0Impl, {
    discriminator: {
      property: 'kind',
      subTypes: [{value: AlgorandRuntimeDataSourceV1_0_0Impl, name: 'algorand/Runtime'}],
    },
    keepDiscriminatorProperty: true,
  })
  dataSources: (RuntimeDataSourceV1_0_0 | CustomDataSourceV1_0_0)[];
  private _deployment: DeploymentV1_0_0;

  toDeployment(): string {
    return yaml.dump(this._deployment, {
      sortKeys: true,
      condenseFlow: true,
    });
  }

  get deployment(): DeploymentV1_0_0 {
    if (!this._deployment) {
      this._deployment = plainToClass(DeploymentV1_0_0, this);
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
