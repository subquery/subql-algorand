// Copyright 2020-2025 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import {AlgorandProjectManifestVersioned, VersionedProjectManifest} from './versioned';

export function parseAlgorandProjectManifest(raw: unknown): AlgorandProjectManifestVersioned {
  const projectManifest = new AlgorandProjectManifestVersioned(raw as VersionedProjectManifest);
  projectManifest.validate();
  return projectManifest;
}
