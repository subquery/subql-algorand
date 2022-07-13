// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { hexToU8a, u8aEq } from '@polkadot/util';
import {
  isRuntimeDs,
  AlgorandHandlerKind,
  isCustomDs,
  isBlockHandlerProcessor,
  isTransactionHandlerProcessor,
} from '@subql/common-substrate';
import {
  AlgorandBlock,
  AlgorandCustomDataSource,
  AlgorandCustomHandler,
  AlgorandTransaction,
  RuntimeHandlerInputMap,
} from '@subql/types';
import { Indexer } from 'algosdk';
import { Sequelize } from 'sequelize';
import { NodeConfig } from '../configure/NodeConfig';
import { SubqlProjectDs, SubqueryProject } from '../configure/SubqueryProject';
import { SubqueryRepo } from '../entities';
import * as AlgorandUtil from '../utils/algorand';
import { getLogger } from '../utils/logger';
import { profiler } from '../utils/profiler';
import { getYargsOption } from '../yargs';
import { ApiService } from './api.service';
import {
  asSecondLayerHandlerProcessor_1_0_0,
  DsProcessorService,
} from './ds-processor.service';
import { DynamicDsService } from './dynamic-ds.service';
import { IndexerEvent } from './events';
import { FetchService } from './fetch.service';
import { MmrService } from './mmr.service';
import { PoiService } from './poi.service';
import { PoiBlock } from './PoiBlock';
import { ProjectService } from './project.service';
import { IndexerSandbox, SandboxService } from './sandbox.service';
import { StoreService } from './store.service';

const NULL_MERKEL_ROOT = hexToU8a('0x00');

const logger = getLogger('indexer');
const { argv } = getYargsOption();

@Injectable()
export class IndexerManager {
  private api: Indexer;
  private filteredDataSources: SubqlProjectDs[];
  private blockOffset: number;

  constructor(
    private storeService: StoreService,
    private apiService: ApiService,
    private fetchService: FetchService,
    protected mmrService: MmrService,
    private sequelize: Sequelize,
    private project: SubqueryProject,
    private sandboxService: SandboxService,
    private dynamicDsService: DynamicDsService,
    private dsProcessorService: DsProcessorService,
    @Inject('Subquery') protected subqueryRepo: SubqueryRepo,
    private eventEmitter: EventEmitter2,
    private projectService: ProjectService,
    private nodeConfig: NodeConfig,
    private poiService: PoiService,
  ) {}

  @profiler(argv.profiler)
  async indexBlock(blockContent: AlgorandBlock): Promise<void> {
    const blockHeight = blockContent.round;
    this.eventEmitter.emit(IndexerEvent.BlockProcessing, {
      height: blockHeight,
      timestamp: Date.now(),
    });
    const tx = await this.sequelize.transaction();
    this.storeService.setTransaction(tx);
    this.storeService.setBlockHeight(blockHeight);

    let poiBlockHash: Uint8Array;
    try {
      // Injected runtimeVersion from fetch service might be outdated
      // const runtimeVersion = await this.fetchService.getRuntimeVersion(block);
      // const apiAt = await this.apiService.getPatchedApi(block, runtimeVersion);

      this.filteredDataSources = this.filterDataSources(blockContent.round);

      const datasources = this.filteredDataSources.concat(
        ...(await this.dynamicDsService.getDynamicDatasources()),
      );

      await this.indexBlockData(
        blockContent,
        datasources,
        (ds: SubqlProjectDs) => {
          const vm = this.sandboxService.getDsProcessor(ds, this.api);

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
              await this.fetchService.resetForNewDs(blockHeight);
            },
            'createDynamicDataSource',
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
      // Need calculate operationHash to ensure correct offset insert all time
      const operationHash = this.storeService.getOperationMerkleRoot();
      if (
        !u8aEq(operationHash, NULL_MERKEL_ROOT) &&
        this.blockOffset === undefined
      ) {
        await this.projectService.upsertMetadataBlockOffset(
          blockHeight - 1,
          tx,
        );
        this.projectService.setBlockOffset(blockHeight - 1);
      }

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
    this.fetchService.latestProcessed(blockContent.round);
  }

  async start(): Promise<void> {
    await this.projectService.init();
    await this.fetchService.init();

    this.api = this.apiService.getApi();
    const startHeight = this.projectService.startHeight;

    void this.fetchService.startLoop(startHeight).catch((err) => {
      logger.error(err, 'failed to fetch block');
      // FIXME: retry before exit
      process.exit(1);
    });
    this.fetchService.register((block) => this.indexBlock(block));
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
    block: AlgorandBlock,
    dataSources: SubqlProjectDs[],
    getVM: (d: SubqlProjectDs) => IndexerSandbox,
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
    getVM: (d: SubqlProjectDs) => IndexerSandbox,
  ): Promise<void> {
    for (const ds of dataSources) {
      await this.indexData(AlgorandHandlerKind.Block, block, ds, getVM(ds));
    }
  }

  private async indexBlockTransactionContent(
    txns: AlgorandTransaction[],
    dataSources: SubqlProjectDs[],
    getVM: (d: SubqlProjectDs) => IndexerSandbox,
  ) {
    for (const ds of dataSources) {
      for (const txn of txns) {
        await this.indexData(
          AlgorandHandlerKind.Transaction,
          txn,
          ds,
          getVM(ds),
        );
      }
    }
  }

  private async indexData<K extends AlgorandHandlerKind>(
    kind: K,
    data: RuntimeHandlerInputMap[K],
    ds: SubqlProjectDs,
    vm: IndexerSandbox,
  ): Promise<void> {
    if (isRuntimeDs(ds)) {
      const handlers = ds.mapping.handlers.filter(
        (h) => h.kind === kind && FilterTypeMap[kind](data as any, h.filter),
      );

      for (const handler of handlers) {
        await vm.securedExec(handler.handler, [data]);
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
              throw new Error('Unsuported handler kind');
          }
        },
      );

      for (const handler of handlers) {
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
        api: null,
        assets,
      })
      .catch((e) => {
        logger.error(e, 'Failed to transform data with ds processor.');
        throw e;
      });

    await Promise.all(
      transformedData.map((data) => vm.securedExec(handler.handler, [data])),
    );
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
