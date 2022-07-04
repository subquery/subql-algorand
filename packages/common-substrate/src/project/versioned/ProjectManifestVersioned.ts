// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {AlgorandDataSource} from '@subql/types';
import {plainToClass} from 'class-transformer';
import {IAlgorandProjectManifest} from '../types';
import {ProjectManifestV0_0_1Impl} from './v0_0_1';
export type VersionedProjectManifest = {specVersion: string};

const ALGORAND_SUPPORTED_VERSIONS = {
  '0.0.1': ProjectManifestV0_0_1Impl,
};

type Versions = keyof typeof ALGORAND_SUPPORTED_VERSIONS;

type ProjectManifestImpls = InstanceType<typeof ALGORAND_SUPPORTED_VERSIONS[Versions]>;

export function manifestIsV0_0_1(manifest: IAlgorandProjectManifest): manifest is ProjectManifestV0_0_1Impl {
  return manifest.specVersion === '0.0.1';
}

export class SubstrateProjectManifestVersioned implements IAlgorandProjectManifest {
  private _impl: ProjectManifestImpls;

  constructor(projectManifest: VersionedProjectManifest) {
    const klass = ALGORAND_SUPPORTED_VERSIONS[projectManifest.specVersion as Versions];
    if (!klass) {
      throw new Error('specVersion not supported for project manifest file');
    }
    this._impl = plainToClass<ProjectManifestImpls, VersionedProjectManifest>(klass, projectManifest);
  }

  get asImpl(): ProjectManifestImpls {
    return this._impl;
  }

  get isV0_0_1(): boolean {
    return this.specVersion === '0.0.1';
  }

  get asV0_0_1(): ProjectManifestV0_0_1Impl {
    return this._impl as ProjectManifestV0_0_1Impl;
  }

  toDeployment(): string | undefined {
    return this._impl.toDeployment();
  }

  validate(): void {
    return this._impl.validate();
  }

  get dataSources(): AlgorandDataSource[] {
    return this._impl.dataSources;
  }

  get schema(): string {
    return this._impl.schema.file;
  }

  get specVersion(): string {
    return this._impl.specVersion;
  }

  get description(): string {
    return this._impl.description;
  }

  get repository(): string {
    return this._impl.repository;
  }
}
