// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';
import path from 'path';
import { LocalReader, Reader, loadFromJsonOrYaml } from '@subql/common';
import {
  isCustomDs,
  // loadChainTypesFromJs,
  AlgorandRuntimeHandler,
  AlgorandCustomHandler,
  AlgorandHandler,
  AlgorandHandlerKind,
  RuntimeDataSourceV1_0_0,
  CustomDataSourceV1_0_0,
} from '@subql/common-algorand';
import {
  loadDataSourceScript,
  updateDataSourcesEntry,
  updateProcessor,
} from '@subql/node-core';
import { getAllEntitiesRelations } from '@subql/utils';
import tar from 'tar';
import { NodeVM, VMScript } from 'vm2';
import { SubqlProjectDs, SubqueryProject } from '../configure/SubqueryProject';

export function isBaseHandler(
  handler: AlgorandHandler,
): handler is AlgorandRuntimeHandler {
  return Object.values<string>(AlgorandHandlerKind).includes(handler.kind);
}

export function isCustomHandler(
  handler: AlgorandHandler,
): handler is AlgorandCustomHandler {
  return !isBaseHandler(handler);
}

export async function updateDataSourcesV1_0_0(
  _dataSources: (RuntimeDataSourceV1_0_0 | CustomDataSourceV1_0_0)[],
  reader: Reader,
  root: string,
): Promise<SubqlProjectDs[]> {
  // force convert to updated ds
  return Promise.all(
    _dataSources.map(async (dataSource) => {
      const entryScript = await loadDataSourceScript(
        reader,
        dataSource.mapping.file,
      );
      const file = await updateDataSourcesEntry(
        reader,
        dataSource.mapping.file,
        root,
        entryScript,
      );
      if (isCustomDs(dataSource)) {
        if (dataSource.processor) {
          dataSource.processor.file = await updateProcessor(
            reader,
            root,
            dataSource.processor.file,
          );
        }
        if (dataSource.assets) {
          for (const [, asset] of dataSource.assets) {
            if (reader instanceof LocalReader) {
              asset.file = path.resolve(root, asset.file);
            } else {
              const res = await reader.getFile(asset.file);
              const outputPath = path.resolve(
                root,
                asset.file.replace('ipfs://', ''),
              );
              await fs.promises.writeFile(outputPath, res as string);
              asset.file = outputPath;
            }
          }
        }
        return {
          ...dataSource,
          mapping: { ...dataSource.mapping, entryScript, file },
        };
      } else {
        return {
          ...dataSource,
          mapping: { ...dataSource.mapping, entryScript, file },
        };
      }
    }),
  );
}

export function loadChainTypes(file: string, projectRoot: string): unknown {
  const { ext } = path.parse(file);
  const filePath = path.resolve(projectRoot, file);
  if (fs.existsSync(filePath)) {
    if (ext === '.js' || ext === '.cjs') {
      //load can be self contained js file, or js depend on node_module which will require project root
      return loadChainTypesFromJs(filePath, projectRoot);
    } else if (ext === '.yaml' || ext === '.yml' || ext === '.json') {
      return loadFromJsonOrYaml(filePath);
    } else {
      throw new Error(`Extension ${ext} not supported`);
    }
  } else {
    throw new Error(`Load from file ${file} not exist`);
  }
}

export function loadChainTypesFromJs(
  filePath: string,
  requireRoot?: string,
): unknown {
  const { base, ext } = path.parse(filePath);
  const root = requireRoot ?? path.dirname(filePath);
  const vm = new NodeVM({
    console: 'redirect',
    wasm: false,
    sandbox: {},
    require: {
      context: 'sandbox',
      external: true,
      builtin: ['path'],
      root: root,
      resolve: (moduleName: string) => {
        return require.resolve(moduleName, { paths: [root] });
      },
    },
    wrapper: 'commonjs',
    sourceExtensions: ['js', 'cjs'],
  });
  let rawContent: unknown;
  try {
    const script = new VMScript(
      `module.exports = require('${filePath}').default;`,
      path.join(root, 'sandbox'),
    ).compile();
    rawContent = vm.run(script) as unknown;
  } catch (err) {
    throw new Error(`\n NodeVM error: ${err}`);
  }
  if (rawContent === undefined) {
    throw new Error(
      `There was no default export found from required ${base} file`,
    );
  }
  return rawContent;
}
