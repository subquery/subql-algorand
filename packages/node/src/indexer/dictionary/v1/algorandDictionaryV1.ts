// Copyright 2020-2024 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import {
  isCustomDs,
  AlgorandHandlerKind,
  AlgorandRuntimeHandlerFilter,
  AlgorandHandler,
  isRuntimeDs,
} from '@subql/common-algorand';
import { NodeConfig, DictionaryV1 } from '@subql/node-core';
import { AlgorandBlockFilter, AlgorandDataSource } from '@subql/types-algorand';
import {
  DictionaryQueryCondition,
  DictionaryQueryEntry as DictionaryV1QueryEntry,
  DsProcessor,
} from '@subql/types-core';
import { sortBy, uniqBy } from 'lodash';
import { SubqueryProject } from '../../../configure/SubqueryProject';
import { isBaseHandler, isCustomHandler } from '../../../utils/project';
import { DsProcessorService } from '../../ds-processor.service';

type GetDsProcessor = DsProcessorService['getDsProcessor'];

function getBaseHandlerKind(
  ds: AlgorandDataSource,
  handler: AlgorandHandler,
  getDsProcessor: GetDsProcessor,
): AlgorandHandlerKind {
  if (isRuntimeDs(ds) && isBaseHandler(handler)) {
    return handler.kind;
  } else if (isCustomDs(ds) && isCustomHandler(handler)) {
    const plugin = getDsProcessor(ds);
    const baseHandler = plugin.handlerProcessors[handler.kind]?.baseHandlerKind;
    if (!baseHandler) {
      throw new Error(
        `handler type ${handler.kind} not found in processor for ${ds.kind}`,
      );
    }
    return baseHandler;
  } else {
    throw new Error('unknown base handler kind');
  }
}

function getBaseHandlerFilters<T extends AlgorandRuntimeHandlerFilter>(
  ds: AlgorandDataSource,
  handlerKind: string,
  getDsProcessor: GetDsProcessor,
): T[] {
  if (isCustomDs(ds)) {
    const plugin = getDsProcessor(ds);
    const processor = plugin.handlerProcessors[handlerKind];
    return processor.baseFilter instanceof Array
      ? (processor.baseFilter as T[])
      : ([processor.baseFilter] as T[]);
  } else {
    throw new Error(`Expected a custom datasource here`);
  }
}

// eslint-disable-next-line complexity
function buildDictionaryV1QueryEntries(
  dataSources: AlgorandDataSource[],
  getDsProcessor: GetDsProcessor,
): DictionaryV1QueryEntry[] {
  const queryEntries: DictionaryV1QueryEntry[] = [];

  for (const ds of dataSources) {
    for (const handler of ds.mapping.handlers) {
      const baseHandlerKind = getBaseHandlerKind(ds, handler, getDsProcessor);
      let filterList: AlgorandRuntimeHandlerFilter[];
      if (isCustomDs(ds)) {
        //const processor = plugin.handlerProcessors[handler.kind];
        filterList = getBaseHandlerFilters<AlgorandRuntimeHandlerFilter>(
          ds,
          handler.kind,
          getDsProcessor,
        );
      } else {
        filterList = handler.filter ? [handler.filter] : [];
      }
      // Filter out any undefined
      filterList = filterList.filter(Boolean);
      if (!filterList.length) return [];
      switch (baseHandlerKind) {
        case AlgorandHandlerKind.Block:
          for (const filter of filterList as AlgorandBlockFilter[]) {
            if (filter.modulo === undefined) {
              return [];
            }
          }
          break;
        case AlgorandHandlerKind.Transaction:
          filterList.forEach((f) => {
            const conditions: DictionaryQueryCondition[] = Object.entries(f)
              .filter(
                ([field, value]) =>
                  field !== 'applicationArgs' && value !== undefined,
              )
              .map(([field, value]) => ({
                field,
                value,
                matcher: 'equalTo',
              }));
            queryEntries.push({
              entity: 'transactions',
              conditions,
            });
          });
          break;
        default:
      }
    }
  }

  return uniqBy(
    queryEntries,
    (item) =>
      `${item.entity}|${JSON.stringify(
        sortBy(item.conditions, (c) => c.field),
      )}`,
  );
}

export class AlgorandDictionaryV1 extends DictionaryV1<AlgorandDataSource> {
  constructor(
    project: SubqueryProject,
    nodeConfig: NodeConfig,
    protected getDsProcessor: GetDsProcessor,
    dictionaryUrl: string,
    chainId?: string,
  ) {
    super(dictionaryUrl, chainId ?? project.network.chainId, nodeConfig);
  }

  static async create(
    project: SubqueryProject,
    nodeConfig: NodeConfig,
    getDsProcessor: GetDsProcessor,
    dictionaryUrl: string,
    chainId?: string,
  ): Promise<AlgorandDictionaryV1> {
    const dictionary = new AlgorandDictionaryV1(
      project,
      nodeConfig,
      getDsProcessor,
      dictionaryUrl,
      chainId,
    );
    await dictionary.init();
    return dictionary;
  }

  buildDictionaryQueryEntries(
    dataSources: AlgorandDataSource[],
  ): DictionaryV1QueryEntry[] {
    return buildDictionaryV1QueryEntries(dataSources, this.getDsProcessor);
  }
}
