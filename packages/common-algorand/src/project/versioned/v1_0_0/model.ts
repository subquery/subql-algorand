// Copyright 2020-2023 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import {
  BaseDeploymentV1_0_0,
  FileType,
  ParentProjectModel,
  ProjectManifestBaseImpl,
  RunnerNodeImpl,
  RunnerQueryBaseModel,
  validateObject,
  CommonProjectNetworkV1_0_0,
  SemverVersionValidator,
} from '@subql/common';
import {
  AlgorandCustomDataSource,
  AlgorandProjectManifestV1_0_0,
  AlgorandRuntimeDataSource,
  CustomDatasourceTemplate,
  RuntimeDatasourceTemplate,
} from '@subql/types-algorand';
import {BaseMapping, NodeSpec, ParentProject, QuerySpec, RunnerSpecs} from '@subql/types-core';
import {plainToInstance, Transform, Type} from 'class-transformer';
import {
  Equals,
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Validate,
  ValidateNested,
  validateSync,
} from 'class-validator';
import yaml from 'js-yaml';
import {CustomDataSourceBase, RuntimeDataSourceBase} from '../../models';
import {TokenHeader} from '../../types';
import {IsStringOrObject} from '../../validation/is-string-or-object.validation';
const ALGORAND_NODE_NAME = `@subql/node-algorand`;

export class AlgorandRunnerNodeImpl implements NodeSpec {
  @Equals(ALGORAND_NODE_NAME, {message: `Runner algorand node name incorrect, suppose be '${ALGORAND_NODE_NAME}'`})
  name: string;

  @IsString()
  @Validate(SemverVersionValidator)
  version: string;
}

export class AlgorandRunnerSpecsImpl implements RunnerSpecs {
  @IsObject()
  @ValidateNested()
  @Type(() => AlgorandRunnerNodeImpl)
  node: NodeSpec;

  @IsObject()
  @ValidateNested()
  @Type(() => RunnerQueryBaseModel)
  query: QuerySpec;
}

export class ProjectNetworkDeploymentV1_0_0 {
  @IsString()
  chainId: string;
  @IsOptional()
  @IsArray()
  bypassBlocks?: (number | string)[];
}

export class ProjectNetworkV1_0_0 extends CommonProjectNetworkV1_0_0<FileType> {
  @IsStringOrObject()
  @IsOptional()
  apiKey?: string | TokenHeader;
}

export class AlgorandRuntimeDataSourceV1_0_0Impl extends RuntimeDataSourceBase {
  validate(): void {
    return validateObject(this, 'failed to validate runtime datasource.');
  }
}

export class AlgorandCustomDataSourceV1_0_0Impl<
    K extends string = string,
    M extends BaseMapping<any, any> = BaseMapping<Record<string, unknown>, any>
  >
  extends CustomDataSourceBase<K, M>
  implements AlgorandCustomDataSource<K, M>
{
  validate(): void {
    return validateObject(this, 'failed to validate custom datasource.');
  }
}

export class RuntimeDataSourceTemplateImpl
  extends AlgorandRuntimeDataSourceV1_0_0Impl
  implements RuntimeDatasourceTemplate
{
  @IsString()
  name: string;
}

export class CustomDataSourceTemplateImpl
  extends AlgorandCustomDataSourceV1_0_0Impl
  implements CustomDatasourceTemplate
{
  @IsString()
  name: string;
}

export class DeploymentV1_0_0 extends BaseDeploymentV1_0_0 {
  @Transform((params) => {
    if (params.value.genesisHash && !params.value.chainId) {
      params.value.chainId = params.value.genesisHash;
    }
    return plainToInstance(ProjectNetworkDeploymentV1_0_0, params.value);
  })
  @ValidateNested()
  @Type(() => ProjectNetworkDeploymentV1_0_0)
  network: ProjectNetworkDeploymentV1_0_0;
  @IsObject()
  @ValidateNested()
  @Type(() => AlgorandRunnerSpecsImpl)
  runner: RunnerSpecs;

  @IsArray()
  @ValidateNested()
  @Type(() => AlgorandCustomDataSourceV1_0_0Impl, {
    discriminator: {
      property: 'kind',
      subTypes: [{value: AlgorandRuntimeDataSourceV1_0_0Impl, name: 'algorand/Runtime'}],
    },
    keepDiscriminatorProperty: true,
  })
  dataSources: (AlgorandCustomDataSource | AlgorandRuntimeDataSource)[];
  @IsOptional()
  @IsArray()
  @ValidateNested()
  @Type(() => CustomDataSourceTemplateImpl, {
    discriminator: {
      property: 'kind',
      subTypes: [{value: RuntimeDataSourceTemplateImpl, name: 'algorand/Runtime'}],
    },
    keepDiscriminatorProperty: true,
  })
  templates?: (RuntimeDatasourceTemplate | CustomDatasourceTemplate)[];
}

export class ProjectManifestV1_0_0Impl
  extends ProjectManifestBaseImpl<DeploymentV1_0_0>
  implements AlgorandProjectManifestV1_0_0
{
  constructor() {
    super(DeploymentV1_0_0);
  }

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
  dataSources: (AlgorandRuntimeDataSource | AlgorandCustomDataSource)[];

  @IsOptional()
  @IsArray()
  @ValidateNested()
  @Type(() => CustomDataSourceTemplateImpl, {
    discriminator: {
      property: 'kind',
      subTypes: [{value: RuntimeDataSourceTemplateImpl, name: 'algorand/Runtime'}],
    },
    keepDiscriminatorProperty: true,
  })
  templates?: (RuntimeDatasourceTemplate | CustomDatasourceTemplate)[];

  @IsObject()
  @ValidateNested()
  @Type(() => AlgorandRunnerSpecsImpl)
  runner: RunnerSpecs;

  @IsOptional()
  @IsObject()
  @Type(() => ParentProjectModel)
  parent?: ParentProject;

  toDeployment(): string {
    return yaml.dump(this._deployment, {
      sortKeys: true,
      condenseFlow: true,
    });
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
