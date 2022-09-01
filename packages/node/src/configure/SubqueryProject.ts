// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {
  ReaderFactory,
  ReaderOptions,
  Reader,
  RunnerSpecs,
  validateSemver,
} from '@subql/common';
import {
  AlgorandProjectNetworkConfig,
  parseAlgorandProjectManifest,
  AlgorandDataSource,
  ProjectManifestV1_0_0Impl,
} from '@subql/common-algorand';
import { buildSchemaFromString } from '@subql/utils';
import { GraphQLSchema } from 'graphql';
import { getProjectRoot, updateDataSourcesV1_0_0 } from '../utils/project';

export type SubqlProjectDs = AlgorandDataSource & {
  mapping: AlgorandDataSource['mapping'] & { entryScript: string };
};

export type SubqlProjectDsTemplate = Omit<SubqlProjectDs, 'startBlock'> & {
  name: string;
};

const NOT_SUPPORT = (name: string) => () => {
  throw new Error(`Manifest specVersion ${name}() is not supported`);
};

export class SubqueryProject {
  id: string;
  root: string;
  network: Partial<AlgorandProjectNetworkConfig>;
  dataSources: SubqlProjectDs[];
  schema: GraphQLSchema;
  templates: SubqlProjectDsTemplate[];
  runner?: RunnerSpecs;

  static async create(
    path: string,
    networkOverrides?: Partial<AlgorandProjectNetworkConfig>,
    readerOptions?: ReaderOptions,
  ): Promise<SubqueryProject> {
    // We have to use reader here, because path can be remote or local
    // and the `loadProjectManifest(projectPath)` only support local mode
    const reader = await ReaderFactory.create(path, readerOptions);
    const projectSchema = await reader.getProjectSchema();
    if (projectSchema === undefined) {
      throw new Error(`Get manifest from project path ${path} failed`);
    }

    const manifest = parseAlgorandProjectManifest(projectSchema);

    if (manifest.isV1_0_0) {
      return loadProjectFromManifest1_0_0(
        manifest.asV1_0_0,
        reader,
        path,
        networkOverrides,
      );
    }
  }
}

export interface SubqueryProjectNetwork {
  chainId: string;
  endpoint?: string;
  dictionary?: string;
}

function processChainId(network: any): SubqueryProjectNetwork {
  if (network.chainId && network.genesisHash) {
    throw new Error('Please only provide one of chainId and genesisHash');
  } else if (network.genesisHash && !network.chainId) {
    network.chainId = network.genesisHash;
  }
  delete network.genesisHash;
  return network;
}

const { version: packageVersion } = require('../../package.json');

async function loadProjectFromManifest1_0_0(
  projectManifest: ProjectManifestV1_0_0Impl,
  reader: Reader,
  path: string,
  networkOverrides?: Partial<AlgorandProjectNetworkConfig>,
): Promise<SubqueryProject> {
  const root = await getProjectRoot(reader);
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
  const dataSources = await updateDataSourcesV1_0_0(
    projectManifest.dataSources,
    reader,
    root,
  );
  const templates = await loadProjectTemplates(projectManifest, root, reader);
  const runner = projectManifest.runner;
  if (!validateSemver(packageVersion, runner.node.version)) {
    throw new Error(
      `Runner require node version ${runner.node.version}, current node ${packageVersion}`,
    );
  }

  return {
    id: reader.root ? reader.root : path,
    root,
    network,
    dataSources,
    schema,
    templates,
    runner,
  };
}

async function loadProjectTemplates(
  projectManifest: ProjectManifestV1_0_0Impl,
  root: string,
  reader: Reader,
): Promise<SubqlProjectDsTemplate[]> {
  if (projectManifest.templates && projectManifest.templates.length !== 0) {
    const dsTemplates = await updateDataSourcesV1_0_0(
      projectManifest.templates,
      reader,
      root,
    );
    return dsTemplates.map((ds, index) => ({
      ...ds,
      name: projectManifest.templates[index].name,
    }));
  }
}
