// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable } from '@nestjs/common';
import {
  isRuntimeDs,
  AlgorandHandlerKind,
  isCustomDs,
  isBlockHandlerProcessor,
  isTransactionHandlerProcessor,
} from '@subql/common-algorand';
import {
  NodeConfig,
  IndexerSandbox,
  getLogger,
  profiler,
  profilerWrap,
  ProcessBlockResponse,
  IIndexerManager,
} from '@subql/node-core';
import {
  AlgorandBlock,
  AlgorandCustomDataSource,
  AlgorandCustomHandler,
  AlgorandTransaction,
  RuntimeHandlerInputMap,
  SafeAPI,
} from '@subql/types-algorand';
import {
  AlgorandApiService,
  filterBlock,
  filterTransaction,
} from '../algorand';
import { SubqlProjectDs } from '../configure/SubqueryProject';
import { yargsOptions } from '../yargs';
import {
  asSecondLayerHandlerProcessor_1_0_0,
  DsProcessorService,
} from './ds-processor.service';
import { DynamicDsService } from './dynamic-ds.service';
import { ProjectService } from './project.service';
import { SandboxService } from './sandbox.service';
import { BlockContent } from './types';

const logger = getLogger('indexer');

@Injectable()
export class IndexerManager
  implements IIndexerManager<BlockContent, SubqlProjectDs>
{
  constructor(
    private apiService: AlgorandApiService,
    private nodeConfig: NodeConfig,
    private sandboxService: SandboxService,
    private dsProcessorService: DsProcessorService,
    private dynamicDsService: DynamicDsService,
    @Inject('IProjectService') private projectService: ProjectService,
  ) {
    logger.info('indexer manager start');
  }

  @profiler(yargsOptions.argv.profiler)
  async indexBlock(
    blockContent: AlgorandBlock,
    dataSources: SubqlProjectDs[],
  ): Promise<ProcessBlockResponse> {
    let dynamicDsCreated = false;
    const blockHeight = blockContent.round;

    const filteredDataSources = this.filterDataSources(
      blockHeight,
      dataSources,
    );

    this.assertDataSources(filteredDataSources, blockHeight);

    let apiAt: SafeAPI;

    await this.indexBlockData(
      blockContent,
      filteredDataSources,
      // eslint-disable-next-line @typescript-eslint/require-await
      async (ds: SubqlProjectDs) => {
        // Injected runtimeVersion from fetch service might be outdated
        apiAt = apiAt ?? this.apiService.api.getSafeApi(blockHeight);

        const vm = this.sandboxService.getDsProcessor(ds, apiAt);

        // Inject function to create ds into vm
        vm.freeze(
          async (templateName: string, args?: Record<string, unknown>) => {
            const newDs = await this.dynamicDsService.createDynamicDatasource({
              templateName,
              args,
              startBlock: blockHeight,
            });

            // Push the newly created dynamic ds to be processed this block on any future extrinsics/events
            filteredDataSources.push(newDs);
            dynamicDsCreated = true;
          },
          'createDynamicDatasource',
        );

        return vm;
      },
    );

    return {
      dynamicDsCreated,
      blockHash: blockContent.hash,
      reindexBlockHeight: null,
    };
  }

  async start(): Promise<void> {
    await this.projectService.init();
    logger.info('indexer manager started');
  }

  private filterDataSources(
    nextProcessingHeight: number,
    dataSources: SubqlProjectDs[],
  ): SubqlProjectDs[] {
    let filteredDs: SubqlProjectDs[];

    filteredDs = dataSources.filter(
      (ds) => ds.startBlock <= nextProcessingHeight,
    );

    if (filteredDs.length === 0) {
      logger.error(`Did not find any matching datasouces`);
      process.exit(1);
    }
    // perform filter for custom ds
    filteredDs = filteredDs.filter((ds) => {
      if (isCustomDs(ds)) {
        return this.dsProcessorService
          .getDsProcessor(ds)
          .dsFilterProcessor(ds, this.apiService.api.api);
      } else {
        return true;
      }
    });

    if (!filteredDs.length) {
      logger.error(`Did not find any datasources with associated processor`);
      process.exit(1);
    }
    return filteredDs;
  }

  private assertDataSources(ds: SubqlProjectDs[], blockHeight: number) {
    if (!ds.length) {
      logger.error(
        `Your start block is greater than the current indexed block height in your database. Either change your startBlock (project.yaml) to <= ${blockHeight}
         or delete your database and start again from the currently specified startBlock`,
      );
      process.exit(1);
    }
  }

  private async indexBlockData(
    block: BlockContent,
    dataSources: SubqlProjectDs[],
    getVM: (d: SubqlProjectDs) => Promise<IndexerSandbox>,
  ): Promise<void> {
    await this.indexBlockContent(block, dataSources, getVM);
    await this.indexBlockTransactionContent(
      block.transactions,
      dataSources,
      getVM,
    );
  }

  private async indexBlockContent(
    block: AlgorandBlock,
    dataSources: SubqlProjectDs[],
    getVM: (d: SubqlProjectDs) => Promise<IndexerSandbox>,
  ): Promise<void> {
    for (const ds of dataSources) {
      await this.indexData(AlgorandHandlerKind.Block, block, ds, getVM);
    }
  }

  private async indexBlockTransactionContent(
    txns: AlgorandTransaction[],
    dataSources: SubqlProjectDs[],
    getVM: (d: SubqlProjectDs) => Promise<IndexerSandbox>,
  ) {
    for (const ds of dataSources) {
      for (const txn of txns) {
        await this.indexData(AlgorandHandlerKind.Transaction, txn, ds, getVM);
      }
    }
  }

  private async indexData<K extends AlgorandHandlerKind>(
    kind: K,
    data: RuntimeHandlerInputMap[K],
    ds: SubqlProjectDs,
    getVM: (ds: SubqlProjectDs) => Promise<IndexerSandbox>,
  ): Promise<void> {
    let vm: IndexerSandbox;
    if (isRuntimeDs(ds)) {
      const handlers = ds.mapping.handlers.filter(
        (h) => h.kind === kind && FilterTypeMap[kind](data as any, h.filter),
      );

      for (const handler of handlers) {
        vm = vm ?? (await getVM(ds));
        this.nodeConfig.profiler
          ? await profilerWrap(
              vm.securedExec.bind(vm),
              'handlerPerformance',
              handler.handler,
            )(handler.handler, [data])
          : await vm.securedExec(handler.handler, [data]);
      }
    } else if (isCustomDs(ds)) {
      const handlers = this.filterCustomDsHandlers<K>(
        ds,
        data,
        ProcessorTypeMap[kind],
        (data, baseFilter) => {
          switch (kind) {
            case AlgorandHandlerKind.Block:
              return !!filterBlock(data as AlgorandBlock, baseFilter);
            case AlgorandHandlerKind.Transaction:
              return !!filterTransaction(
                data as AlgorandTransaction,
                baseFilter,
              );

            default:
              throw new Error('Unsupported handler kind');
          }
        },
      );

      for (const handler of handlers) {
        vm = vm ?? (await getVM(ds));
        await this.transformAndExecuteCustomDs(ds, vm, handler, data);
      }
    }
  }

  private filterCustomDsHandlers<K extends AlgorandHandlerKind>(
    ds: AlgorandCustomDataSource<string>,
    data: RuntimeHandlerInputMap[K],
    baseHandlerCheck: ProcessorTypeMap[K],
    baseFilter: (data: RuntimeHandlerInputMap[K], baseFilter: any) => boolean,
  ): AlgorandCustomHandler[] {
    const plugin = this.dsProcessorService.getDsProcessor(ds);

    return ds.mapping.handlers
      .filter((handler) => {
        const processor = plugin.handlerProcessors[handler.kind];
        if (baseHandlerCheck(processor)) {
          processor.baseFilter;
          return baseFilter(data, processor.baseFilter);
        }
        return false;
      })
      .filter((handler) => {
        const processor = asSecondLayerHandlerProcessor_1_0_0(
          plugin.handlerProcessors[handler.kind],
        );

        try {
          return processor.filterProcessor({
            filter: handler.filter,
            input: data,
            ds,
          });
        } catch (e) {
          logger.error(e, 'Failed to run ds processer filter.');
          throw e;
        }
      });
  }

  private async transformAndExecuteCustomDs<K extends AlgorandHandlerKind>(
    ds: AlgorandCustomDataSource<string>,
    vm: IndexerSandbox,
    handler: AlgorandCustomHandler,
    data: RuntimeHandlerInputMap[K],
  ): Promise<void> {
    const plugin = this.dsProcessorService.getDsProcessor(ds);
    const assets = await this.dsProcessorService.getAssets(ds);

    const processor = asSecondLayerHandlerProcessor_1_0_0(
      plugin.handlerProcessors[handler.kind],
    );

    const transformedData = await processor
      .transformer({
        input: data,
        ds,
        filter: handler.filter,
        api: this.apiService.api.api,
        assets,
      })
      .catch((e) => {
        logger.error(e, 'Failed to transform data with ds processor.');
        throw e;
      });

    // We can not run this in parallel. the transformed data items may be dependent on one another.
    // An example of this is with Acala EVM packing multiple EVM logs into a single Substrate event
    for (const _data of transformedData) {
      await vm.securedExec(handler.handler, [_data]);
    }
  }
}

type ProcessorTypeMap = {
  [AlgorandHandlerKind.Block]: typeof isBlockHandlerProcessor;
  [AlgorandHandlerKind.Transaction]: typeof isTransactionHandlerProcessor;
};
const ProcessorTypeMap = {
  [AlgorandHandlerKind.Block]: isBlockHandlerProcessor,
  [AlgorandHandlerKind.Transaction]: isTransactionHandlerProcessor,
};
const FilterTypeMap = {
  [AlgorandHandlerKind.Block]: filterBlock,
  [AlgorandHandlerKind.Transaction]: filterTransaction,
};
