// Copyright 2020-2025 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import { Inject, Injectable } from '@nestjs/common';
import { isCustomDs, isRuntimeDs } from '@subql/common-algorand';
import {
  DatasourceParams,
  DynamicDsService as BaseDynamicDsService,
} from '@subql/node-core';
import { AlgorandDataSource } from '@subql/types-algorand';
import { TransactionType } from 'algosdk';
import { SubqueryProject } from '../configure/SubqueryProject';
import { DsProcessorService } from './ds-processor.service';

@Injectable()
export class DynamicDsService extends BaseDynamicDsService<
  AlgorandDataSource,
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
  ): Promise<AlgorandDataSource> {
    const dsObj = this.getTemplate<AlgorandDataSource>(
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
      throw new Error(`Unable to create dynamic datasource.`, { cause: e });
    }
  }
}
