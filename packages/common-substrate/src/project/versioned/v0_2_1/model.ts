// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {plainToClass, Type} from 'class-transformer';
import {Equals, IsArray, IsOptional, IsString, ValidateNested, validateSync} from 'class-validator';
import {
  SubstrateCustomDataSourceV0_2_0Impl,
  DeploymentV0_2_0,
  ProjectManifestV0_2_0Impl,
  SubstrateRuntimeDataSourceV0_2_0Impl,
} from '../v0_2_0';
import {CustomDataSourceTemplate, SubstrateProjectManifestV0_2_1, RuntimeDataSourceTemplate} from './types';

export class RuntimeDataSourceTemplateImpl
  extends SubstrateRuntimeDataSourceV0_2_0Impl
  implements RuntimeDataSourceTemplate
{
  @IsString()
  name: string;
}

export class CustomDataSourceTemplateImpl
  extends SubstrateCustomDataSourceV0_2_0Impl
  implements CustomDataSourceTemplate
{
  @IsString()
  name: string;
}

export class DeploymentV0_2_1 extends DeploymentV0_2_0 {
  @Equals('0.2.1')
  @IsString()
  specVersion: string;

  @IsOptional()
  @IsArray()
  @ValidateNested()
  @Type(() => CustomDataSourceTemplateImpl, {
    discriminator: {
      property: 'kind',
      subTypes: [{value: RuntimeDataSourceTemplateImpl, name: 'substrate/Runtime'}],
    },
    keepDiscriminatorProperty: true,
  })
  templates?: (RuntimeDataSourceTemplate | CustomDataSourceTemplate)[];
}

export class ProjectManifestV0_2_1Impl
  extends ProjectManifestV0_2_0Impl<DeploymentV0_2_1>
  implements SubstrateProjectManifestV0_2_1
{
  @IsOptional()
  @IsArray()
  @ValidateNested()
  @Type(() => CustomDataSourceTemplateImpl, {
    discriminator: {
      property: 'kind',
      subTypes: [{value: RuntimeDataSourceTemplateImpl, name: 'substrate/Runtime'}],
    },
    keepDiscriminatorProperty: true,
  })
  templates?: (RuntimeDataSourceTemplate | CustomDataSourceTemplate)[];
  protected _deployment: DeploymentV0_2_1;

  get deployment(): DeploymentV0_2_1 {
    if (!this._deployment) {
      this._deployment = plainToClass(DeploymentV0_2_1, this);
      validateSync(this._deployment, {whitelist: true});
    }
    return this._deployment;
  }
}
