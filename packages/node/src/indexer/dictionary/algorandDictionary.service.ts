// Copyright 2020-2024 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NETWORK_FAMILY } from '@subql/common';
import { NodeConfig, DictionaryService, getLogger } from '@subql/node-core';
import { AlgorandBlock, AlgorandDataSource } from '@subql/types-algorand';
import { SubqueryProject } from '../../configure/SubqueryProject';
import { DsProcessorService } from '../ds-processor.service';
import { AlgorandDictionaryV1 } from './v1';

const logger = getLogger('AlograndDictionary');

@Injectable()
export class AlgorandDictionaryService extends DictionaryService<
  AlgorandDataSource,
  AlgorandBlock
> {
  async initDictionaries(): Promise<void> {
    const dictionariesV1: AlgorandDictionaryV1[] = [];

    if (!this.project) {
      throw new Error(`Project in Dictionary service not initialized `);
    }
    const registryDictionaries = await this.resolveDictionary(
      NETWORK_FAMILY.algorand,
      this.project.network.chainId,
      this.nodeConfig.dictionaryRegistry,
    );

    logger.debug(`Dictionary registry endpoints: ${registryDictionaries}`);

    const dictionaryEndpoints: string[] = (
      !Array.isArray(this.project.network.dictionary)
        ? !this.project.network.dictionary
          ? []
          : [this.project.network.dictionary]
        : this.project.network.dictionary
    ).concat(registryDictionaries);

    for (const endpoint of dictionaryEndpoints) {
      try {
        const dictionaryV1 = await AlgorandDictionaryV1.create(
          this.project,
          this.nodeConfig,
          this.dsProcessorService.getDsProcessor.bind(this),
          endpoint,
        );
        dictionariesV1.push(dictionaryV1);
      } catch (e) {
        logger.warn(
          `Dictionary endpoint "${endpoint}" is not a valid dictionary`,
        );
      }
    }

    this.init(dictionariesV1);
  }

  constructor(
    @Inject('ISubqueryProject') protected project: SubqueryProject,
    nodeConfig: NodeConfig,
    eventEmitter: EventEmitter2,
    protected dsProcessorService: DsProcessorService,
  ) {
    super(project.network.chainId, nodeConfig, eventEmitter);
  }
}
