// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable } from '@nestjs/common';
import { hexToU8a, u8aEq } from '@polkadot/util';
import {
  isRuntimeDs,
  AlgorandHandlerKind,
  isCustomDs,
  isBlockHandlerProcessor,
  isTransactionHandlerProcessor,
} from '@subql/common-algorand';
import {
  PoiBlock,
  StoreService,
  PoiService,
  SubqueryRepo,
  NodeConfig,
  getYargsOption,
  getLogger,
  profiler,
  profilerWrap,
} from '@subql/node-core';
import {
  AlgorandBlock,
  AlgorandCustomDataSource,
  AlgorandCustomHandler,
  AlgorandTransaction,
  RuntimeHandlerInputMap,
  SafeAPI,
} from '@subql/types-algorand';
import { Indexer } from 'algosdk';
import { Sequelize } from 'sequelize';
import { SubqlProjectDs, SubqueryProject } from '../configure/SubqueryProject';
import * as AlgorandUtil from '../utils/algorand';
import { ApiService } from './api.service';
import {
  asSecondLayerHandlerProcessor_1_0_0,
  DsProcessorService,
} from './ds-processor.service';
import { DynamicDsService } from './dynamic-ds.service';
import { ProjectService } from './project.service';
import { IndexerSandbox, SandboxService } from './sandbox.service';
import { BlockContent } from './types';

const NULL_MERKEL_ROOT = hexToU8a('0x00');

const logger = getLogger('indexer');
const { argv } = getYargsOption();

@Injectable()
export class IndexerManager {
  private api: Indexer;
  private filteredDataSources: SubqlProjectDs[];

  constructor(
    private storeService: StoreService,
    private apiService: ApiService,
    private poiService: PoiService,
    private sequelize: Sequelize,
    private project: SubqueryProject,
    private nodeConfig: NodeConfig,
    private sandboxService: SandboxService,
    private dsProcessorService: DsProcessorService,
    private dynamicDsService: DynamicDsService,
    @Inject('Subquery') protected subqueryRepo: SubqueryRepo,
    private projectService: ProjectService,
  ) {
    logger.info('indexer manager start');

    this.api = this.apiService.getApi();
  }

  @profiler(argv.profiler)
  async indexBlock(
    blockContent: AlgorandBlock,
  ): Promise<{ dynamicDsCreated: boolean; operationHash: Uint8Array }> {
    let dynamicDsCreated = false;
    const blockHeight = blockContent.round;
    const tx = await this.sequelize.transaction();
    this.storeService.setTransaction(tx);
    this.storeService.setBlockHeight(blockHeight);

    let operationHash = NULL_MERKEL_ROOT;
    let poiBlockHash: Uint8Array;
    try {
      this.filteredDataSources = this.filterDataSources(blockContent.round);

      const datasources = this.filteredDataSources.concat(
        ...(await this.dynamicDsService.getDynamicDatasources()),
      );

      let apiAt: SafeAPI;

      await this.indexBlockData(
        blockContent,
        datasources,
        // eslint-disable-next-line @typescript-eslint/require-await
        async (ds: SubqlProjectDs) => {
          // Injected runtimeVersion from fetch service might be outdated
          apiAt = apiAt ?? this.apiService.getSafeApi(blockHeight);

          const vm = this.sandboxService.getDsProcessor(ds, apiAt);

          // Inject function to create ds into vm
          vm.freeze(
            async (templateName: string, args?: Record<string, unknown>) => {
              const newDs = await this.dynamicDsService.createDynamicDatasource(
                {
                  templateName,
                  args,
                  startBlock: blockHeight,
                },
                tx,
              );

              // Push the newly created dynamic ds to be processed this block on any future extrinsics/events
              datasources.push(newDs);
              dynamicDsCreated = true;
            },
            'createDynamicDatasource',
          );

          return vm;
        },
      );

      await this.storeService.setMetadataBatch(
        [
          { key: 'lastProcessedHeight', value: blockHeight },
          { key: 'lastProcessedTimestamp', value: Date.now() },
        ],
        { transaction: tx },
      );
      // Db Metadata increase BlockCount, in memory ref to block-dispatcher _processedBlockCount
      await this.storeService.incrementBlockCount(tx);

      // Need calculate operationHash to ensure correct offset insert all time
      operationHash = this.storeService.getOperationMerkleRoot();
      if (this.nodeConfig.proofOfIndex) {
        //check if operation is null, then poi will not be inserted
        if (!u8aEq(operationHash, NULL_MERKEL_ROOT)) {
          const poiBlock = PoiBlock.create(
            blockHeight,
            blockContent.round.toString(),
            operationHash,
            await this.poiService.getLatestPoiBlockHash(),
            this.project.id,
          );
          poiBlockHash = poiBlock.hash;
          await this.storeService.setPoi(poiBlock, { transaction: tx });
          this.poiService.setLatestPoiBlockHash(poiBlockHash);
          await this.storeService.setMetadataBatch(
            [{ key: 'lastPoiHeight', value: blockHeight }],
            { transaction: tx },
          );
        }
      }
    } catch (e) {
      await tx.rollback();
      throw e;
    }

    await tx.commit();

    return {
      dynamicDsCreated,
      operationHash,
    };
  }

  async start(): Promise<void> {
    await this.projectService.init();
  }

  private filterDataSources(nextProcessingHeight: number): SubqlProjectDs[] {
    let filteredDs = this.project.dataSources.filter(
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
          .dsFilterProcessor(ds, this.api);
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
        argv.profiler
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
              return !!AlgorandUtil.filterBlock(
                data as AlgorandBlock,
                baseFilter,
              );
            case AlgorandHandlerKind.Transaction:
              return !!AlgorandUtil.filterTransaction(
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
        api: this.api,
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
  [AlgorandHandlerKind.Block]: AlgorandUtil.filterBlock,
  [AlgorandHandlerKind.Transaction]: AlgorandUtil.filterTransaction,
};
