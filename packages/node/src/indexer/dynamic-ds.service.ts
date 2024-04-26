// Copyright 2020-2024 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import { Inject, Injectable } from '@nestjs/common';
import { isCustomDs, isRuntimeDs } from '@subql/common-algorand';
import {
  DatasourceParams,
  DynamicDsService as BaseDynamicDsService,
} from '@subql/node-core';
import { TransactionType } from 'algosdk';
import {
  AlgorandProjectDs,
  SubqueryProject,
} from '../configure/SubqueryProject';
import { DsProcessorService } from './ds-processor.service';

@Injectable()
export class DynamicDsService extends BaseDynamicDsService<
  AlgorandProjectDs,
  SubqueryProject
> {
  constructor(
    private readonly dsProcessorService: DsProcessorService,
    @Inject('ISubqueryProject') project: SubqueryProject,
  ) {
    super(project);
  }

  protected async getDatasource(
    params: DatasourceParams,
  ): Promise<AlgorandProjectDs> {
    const dsObj = this.getTemplate<AlgorandProjectDs>(
      params.templateName,
      params.startBlock,
    );
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
