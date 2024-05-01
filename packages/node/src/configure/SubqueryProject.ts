// Copyright 2020-2024 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import assert from 'assert';
import { Injectable } from '@nestjs/common';
import { validateSemver } from '@subql/common';
import {
  parseAlgorandProjectManifest,
  ProjectManifestV1_0_0Impl,
  BlockFilter,
  isRuntimeDs,
  AlgorandHandlerKind,
  isCustomDs,
} from '@subql/common-algorand';
import {
  CronFilter,
  insertBlockFiltersCronSchedules,
  loadProjectTemplates,
  updateDataSourcesV1_0_0,
} from '@subql/node-core';
import {
  AlgorandDataSource,
  CustomDatasourceTemplate,
  RuntimeDatasourceTemplate,
} from '@subql/types-algorand';
import {
  IProjectNetworkConfig,
  ParentProject,
  Reader,
  RunnerSpecs,
} from '@subql/types-core';
import { buildSchemaFromString } from '@subql/utils';
import { GraphQLSchema } from 'graphql';

const { version: packageVersion } = require('../../package.json');

export type AlgorandProjectDsTemplate =
  | RuntimeDatasourceTemplate
  | CustomDatasourceTemplate;

export type SubqlProjectBlockFilter = BlockFilter & CronFilter;

const NOT_SUPPORT = (name: string) => {
  throw new Error(`Manifest specVersion ${name}() is not supported`);
};

// This is the runtime type after we have mapped genesisHash to chainId and endpoint/dict have been provided when dealing with deployments
type NetworkConfig = IProjectNetworkConfig & { chainId: string };

@Injectable()
export class SubqueryProject {
  #dataSources: AlgorandDataSource[];

  constructor(
    readonly id: string,
    readonly root: string,
    readonly network: NetworkConfig,
    dataSources: AlgorandDataSource[],
    readonly schema: GraphQLSchema,
    readonly templates: AlgorandProjectDsTemplate[],
    readonly runner?: RunnerSpecs,
    readonly parent?: ParentProject,
  ) {
    this.#dataSources = dataSources;
  }

  get dataSources(): AlgorandDataSource[] {
    return this.#dataSources;
  }

  async applyCronTimestamps(
    getTimestamp: (height: number) => Promise<Date>,
  ): Promise<void> {
    this.#dataSources = await insertBlockFiltersCronSchedules(
      this.dataSources,
      getTimestamp,
      isRuntimeDs,
      AlgorandHandlerKind.Block,
    );
  }

  static async create(
    path: string,
    rawManifest: unknown,
    reader: Reader,
    root: string,
    networkOverrides?: Partial<IProjectNetworkConfig>,
  ): Promise<SubqueryProject> {
    // rawManifest and reader can be reused here.
    // It has been pre-fetched and used for rebase manifest runner options with args
    // in order to generate correct configs.

    // But we still need reader here, because path can be remote or local
    // and the `loadProjectManifest(projectPath)` only support local mode
    if (rawManifest === undefined) {
      throw new Error(`Get manifest from project path ${path} failed`);
    }

    const manifest = parseAlgorandProjectManifest(rawManifest);

    if (!manifest.isV1_0_0) {
      NOT_SUPPORT('<1.0.0');
    }

    return loadProjectFromManifestBase(
      manifest.asV1_0_0,
      reader,
      path,
      root,
      networkOverrides,
    );
  }
}

function processChainId(network: any): NetworkConfig {
  if (network.chainId && network.genesisHash) {
    throw new Error('Please only provide one of chainId and genesisHash');
  } else if (network.genesisHash && !network.chainId) {
    network.chainId = network.genesisHash;
  }
  delete network.genesisHash;
  return network;
}
type SUPPORT_MANIFEST = ProjectManifestV1_0_0Impl;

async function loadProjectFromManifestBase(
  projectManifest: SUPPORT_MANIFEST,
  reader: Reader,
  path: string,
  root: string,
  networkOverrides?: Partial<IProjectNetworkConfig>,
): Promise<SubqueryProject> {
  if (typeof projectManifest.network.endpoint === 'string') {
    projectManifest.network.endpoint = [projectManifest.network.endpoint];
  }

  const network = processChainId({
    ...projectManifest.network,
    ...networkOverrides,
  });

  if (!network.endpoint) {
    throw new Error(
      `Network endpoint must be provided for network. chainId="${network.chainId}"`,
    );
  }

  let schemaString: string;
  try {
    schemaString = await reader.getFile(projectManifest.schema.file);
  } catch (e) {
    throw new Error(
      `unable to fetch the schema from ${projectManifest.schema.file}`,
    );
  }
  const schema = buildSchemaFromString(schemaString);

  const templates = await loadProjectTemplates(
    projectManifest.templates,
    root,
    reader,
    isCustomDs,
  );
  const runner = projectManifest.runner;
  assert(
    validateSemver(packageVersion, runner.node.version),
    new Error(
      `Runner require node version ${runner.node.version}, current node ${packageVersion}`,
    ),
  );

  const dataSources = await updateDataSourcesV1_0_0(
    projectManifest.dataSources,
    reader,
    root,
    isCustomDs,
  );
  return new SubqueryProject(
    reader.root ? reader.root : path, //TODO, need to method to get project_id
    root,
    network,
    dataSources,
    schema,
    templates,
    runner,
    projectManifest.parent,
  );
}
