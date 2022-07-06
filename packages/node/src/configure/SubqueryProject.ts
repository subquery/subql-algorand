// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RegisteredTypes } from '@polkadot/types/types';
import {
  ReaderFactory,
  ReaderOptions,
  Reader,
  RunnerSpecs,
} from '@subql/common';
import {
  AlgorandProjectNetworkConfig,
  parseAlgorandProjectManifest,
  AlgorandDataSource,
  FileType,
  ProjectManifestV1_0_0Impl,
} from '@subql/common-substrate';
import { buildSchemaFromString } from '@subql/utils';
import { GraphQLSchema } from 'graphql';
import {
  getChainTypes,
  getProjectRoot,
  updateDataSourcesV1_0_0,
} from '../utils/project';

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
  chainTypes?: RegisteredTypes;
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
      return loadProjectFromManifest0_1_0(
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
  chaintypes?: FileType;
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

async function loadProjectFromManifest0_1_0(
  projectManifest: ProjectManifestV1_0_0Impl,
  reader: Reader,
  path: string,
  networkOverrides?: Partial<AlgorandProjectNetworkConfig>,
): Promise<SubqueryProject> {
  return {
    id: path, //user project path as it id for now
    root: await getProjectRoot(reader),
    network: {
      ...projectManifest.network,
      ...networkOverrides,
    },
    dataSources: await updateDataSourcesV1_0_0(
      projectManifest.dataSources,
      reader,
    ),
    schema: buildSchemaFromString(
      await reader.getFile(projectManifest.schema.file),
    ),
    chainTypes: undefined,
    templates: [],
  };
}
