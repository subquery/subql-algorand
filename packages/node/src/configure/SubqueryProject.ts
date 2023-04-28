// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Injectable } from '@nestjs/common';
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
  BlockFilter,
  isRuntimeDs,
  AlgorandHandlerKind,
} from '@subql/common-algorand';
import { AlgorandBlock } from '@subql/types-algorand';
import { buildSchemaFromString } from '@subql/utils';
import Cron from 'cron-converter';
import { GraphQLSchema } from 'graphql';
import { AlgorandApi } from '../algorand';
import { getProjectRoot, updateDataSourcesV1_0_0 } from '../utils/project';

export type SubqlProjectDs = AlgorandDataSource & {
  mapping: AlgorandDataSource['mapping'] & { entryScript: string };
};

export type SubqlProjectBlockFilter = BlockFilter & {
  cronSchedule?: {
    schedule: Cron.Seeker;
    next: number;
  };
};

export type SubqlProjectDsTemplate = Omit<SubqlProjectDs, 'startBlock'> & {
  name: string;
};

const NOT_SUPPORT = (name: string) => {
  throw new Error(`Manifest specVersion ${name}() is not supported`);
};

// This is the runtime type after we have mapped genesisHash to chainId and endpoint/dict have been provided when dealing with deployments
type NetworkConfig = AlgorandProjectNetworkConfig & { chainId: string };

@Injectable()
export class SubqueryProject {
  id: string;
  root: string;
  network: NetworkConfig;
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

function processChainId(network: any): NetworkConfig {
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

  return [];
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function generateTimestampReferenceForBlockFilters(
  dataSources: SubqlProjectDs[],
  api: AlgorandApi,
): Promise<SubqlProjectDs[]> {
  const cron = new Cron();

  dataSources = await Promise.all(
    dataSources.map(async (ds) => {
      if (isRuntimeDs(ds)) {
        const startBlock = ds.startBlock ?? 1;
        let block: AlgorandBlock;
        let timestampReference: Date;
        ds.mapping.handlers = await Promise.all(
          ds.mapping.handlers.map(async (handler) => {
            if (handler.kind === AlgorandHandlerKind.Block) {
              if (handler.filter?.timestamp) {
                if (!block) {
                  block = await api.getBlockByHeight(startBlock);

                  timestampReference = new Date(block.timestamp);
                }
                try {
                  cron.fromString(handler.filter.timestamp);
                } catch (e) {
                  throw new Error(
                    `Invalid Cron string: ${handler.filter.timestamp}`,
                  );
                }

                const schedule = cron.schedule(timestampReference);
                (handler.filter as SubqlProjectBlockFilter).cronSchedule = {
                  schedule: schedule,
                  get next() {
                    return Date.parse(this.schedule.next().format());
                  },
                };
              }
            }
            return handler;
          }),
        );
      }
      return ds;
    }),
  );

  return dataSources;
}
