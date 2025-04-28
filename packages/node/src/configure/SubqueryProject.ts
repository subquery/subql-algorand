// Copyright 2020-2025 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import {
  parseAlgorandProjectManifest,
  BlockFilter,
  isRuntimeDs,
  AlgorandHandlerKind,
  isCustomDs,
} from '@subql/common-algorand';
import { BaseSubqueryProject, CronFilter } from '@subql/node-core';
import {
  AlgorandDataSource,
  CustomDatasourceTemplate,
  RuntimeDatasourceTemplate,
} from '@subql/types-algorand';
import { IProjectNetworkConfig, Reader } from '@subql/types-core';

const { version: packageVersion } = require('../../package.json');

export type AlgorandProjectDsTemplate =
  | RuntimeDatasourceTemplate
  | CustomDatasourceTemplate;

export type SubqlProjectBlockFilter = BlockFilter & CronFilter;

// This is the runtime type after we have mapped genesisHash to chainId and endpoint/dict have been provided when dealing with deployments
type NetworkConfig = IProjectNetworkConfig & { chainId: string };

export type SubqueryProject = BaseSubqueryProject<
  AlgorandDataSource,
  AlgorandProjectDsTemplate,
  NetworkConfig
>;

export async function createSubQueryProject(
  path: string,
  rawManifest: unknown,
  reader: Reader,
  root: string, // If project local then directory otherwise temp directory
  networkOverrides?: Partial<NetworkConfig>,
): Promise<SubqueryProject> {
  const project = await BaseSubqueryProject.create<SubqueryProject>({
    parseManifest: (raw) => parseAlgorandProjectManifest(raw).asV1_0_0,
    path,
    rawManifest,
    reader,
    root,
    nodeSemver: packageVersion,
    blockHandlerKind: AlgorandHandlerKind.Block,
    networkOverrides,
    isRuntimeDs,
    isCustomDs,
  });

  return project;
}
