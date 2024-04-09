// Copyright 2020-2023 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import { Inject, Injectable } from '@nestjs/common';
import { isCustomDs, isRuntimeDs } from '@subql/common-algorand';
import {
  DatasourceParams,
  DynamicDsService as BaseDynamicDsService,
} from '@subql/node-core';
import { TransactionType } from 'algosdk';
import { cloneDeep } from 'lodash';
import {
  AlgorandProjectDs,
  SubqueryProject,
} from '../configure/SubqueryProject';
import { DsProcessorService } from './ds-processor.service';

@Injectable()
export class DynamicDsService extends BaseDynamicDsService<AlgorandProjectDs> {
  constructor(
    private readonly dsProcessorService: DsProcessorService,
    @Inject('ISubqueryProject') private readonly project: SubqueryProject,
  ) {
    super();
  }

  protected async getDatasource(
    params: DatasourceParams,
  ): Promise<AlgorandProjectDs> {
    const t = this.project.templates.find(
      (t) => t.name === params.templateName,
    );
    if (!t) {
      throw new Error(
        `Unable to find matching template in project for name: "${params.templateName}"`,
      );
    }
    const { name, ...template } = cloneDeep(t);

    const dsObj = {
      ...template,
      startBlock: params.startBlock,
    } as AlgorandProjectDs;

    try {
      if (isCustomDs(dsObj)) {
        dsObj.processor.options = {
          ...dsObj.processor.options,
          ...params.args,
        };
        await this.dsProcessorService.validateCustomDs([dsObj]);
      } else if (isRuntimeDs(dsObj)) {
        dsObj.mapping.handlers.forEach((handler) => {
          handler.filter = { ...handler.filter, txType: TransactionType.appl };
        });
      }

      return dsObj;
    } catch (e) {
      throw new Error(`Unable to create dynamic datasource.\n ${e.message}`);
    }
  }
}
