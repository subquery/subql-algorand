// Copyright 2020-2023 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import { EventEmitter2 } from '@nestjs/event-emitter';
import { NodeConfig } from '@subql/node-core';
import { DictionaryService } from './dictionary.service';

describe('dictionary service', () => {
  let dictionaryService: DictionaryService;

  beforeEach(() => {
    dictionaryService = new DictionaryService(
      {
        network: {
          chainId: 'wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=',
          dictionary:
            'https://api.subquery.network/sq/subquery/Algorand-Dictionary',
        },
      } as any,
      { dictionaryTimeout: 10000 } as NodeConfig,
      new EventEmitter2(),
    );
  });

  it('successfully validates metatada', async () => {
    /* Genesis hash is unused with cosmos, chainId is used from project instead */
    await expect(
      dictionaryService.initValidation(
        'wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=',
      ),
    ).resolves.toBeTruthy();
  });
});
