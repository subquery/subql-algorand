// Copyright 2020-2023 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import {getManifestPath, loadFromJsonOrYaml} from '@subql/common';
import {AlgorandProjectManifestVersioned, VersionedProjectManifest} from './versioned';

export function parseAlgorandProjectManifest(raw: unknown): AlgorandProjectManifestVersioned {
  const projectManifest = new AlgorandProjectManifestVersioned(raw as VersionedProjectManifest);
  projectManifest.validate();
  return projectManifest;
}

export function loadSubstrateProjectManifest(file: string): AlgorandProjectManifestVersioned {
  const doc = loadFromJsonOrYaml(getManifestPath(file));
  const projectManifest = new AlgorandProjectManifestVersioned(doc as VersionedProjectManifest);
  projectManifest.validate();
  return projectManifest;
}
