// Copyright 2020-2025 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import {AlgorandDataSource} from '@subql/types-algorand';
import {plainToClass} from 'class-transformer';
import {IAlgorandProjectManifest} from '../types';
import {ProjectManifestV1_0_0Impl} from './v1_0_0';
export type VersionedProjectManifest = {specVersion: string};

const ALGORAND_SUPPORTED_VERSIONS = {
  '1.0.0': ProjectManifestV1_0_0Impl,
};

type Versions = keyof typeof ALGORAND_SUPPORTED_VERSIONS;

export type ProjectManifestImpls = InstanceType<(typeof ALGORAND_SUPPORTED_VERSIONS)[Versions]>;

export function manifestIsV1_0_0(manifest: IAlgorandProjectManifest): manifest is ProjectManifestV1_0_0Impl {
  return manifest.specVersion === '1.0.0';
}

export class AlgorandProjectManifestVersioned implements IAlgorandProjectManifest {
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

  get isV1_0_0(): boolean {
    return this.specVersion === '1.0.0';
  }

  get asV1_0_0(): ProjectManifestV1_0_0Impl {
    return this._impl as ProjectManifestV1_0_0Impl;
  }

  toDeployment(): string {
    return this._impl.deployment.toYaml();
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

  get description(): string | undefined {
    return this._impl.description;
  }

  get repository(): string | undefined {
    return this._impl.repository;
  }
}
