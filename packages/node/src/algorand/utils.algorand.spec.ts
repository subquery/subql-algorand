// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { INestApplication } from '@nestjs/common';
import { AlgorandBlock } from '@subql/types-algorand';
import { prepareApiService } from './algorand.spec';
import { AlgorandApiService } from './api.service.algorand';
import { filterTransaction } from './utils.algorand';

describe('Algorand Filters', () => {
  describe('Transaction Filters', () => {
    let app: INestApplication;
    let api: AlgorandApiService;
    let block: AlgorandBlock;

    beforeAll(async () => {
      [app, api] = await prepareApiService();

      block = await api.api.getBlockByHeight(30478896);
    });

    afterAll(async () => {
      await app?.close();
    });

    it('returns true with no filter', () => {
      expect(filterTransaction(block.transactions[13])).toBeTruthy();
    });

    it('can fillter by sender', () => {
      expect(
        filterTransaction(block.transactions[13], {
          sender: '5GMADASEGJ324HR4GI2XZ2BNSN77ND45LLF4F4XDTAYX3YM6TX5YEU4FEA',
        }),
      ).toBeTruthy();
      expect(
        filterTransaction(block.transactions[13], { sender: 'WRONG_ADDRESSS' }),
      ).toBeFalsy();
    });

    it('can fillter by receiver', () => {
      expect(
        filterTransaction(block.transactions[18], {
          receiver:
            'V6CK3HRC4JBRBDIBB4JWOBMYNUYIP7SYHRPVHH5ZMJQME337C57IBIZVFI',
        }),
      ).toBeTruthy();
      expect(
        filterTransaction(block.transactions[18], {
          receiver: 'WRONG_ADDRESSS',
        }),
      ).toBeFalsy();
    });

    it('can fillter by application id', () => {
      expect(
        filterTransaction(block.transactions[13], { applicationId: 971368268 }),
      ).toBeTruthy();
      expect(
        filterTransaction(block.transactions[13], { applicationId: 0 }),
      ).toBeFalsy();
    });

    it('can fillter by application args', () => {
      // Filter single argument (function signature)
      expect(
        filterTransaction(block.transactions[13], {
          applicationArgs: ['udVC+w=='],
        }),
      ).toBeTruthy();
      // Filter all arguments
      expect(
        filterTransaction(block.transactions[13], {
          applicationArgs: ['udVC+w==', 'AQ==', 'AA==', 'AQ==', 'AQ=='],
        }),
      ).toBeTruthy();
      // Filter specific argument
      expect(
        filterTransaction(block.transactions[13], {
          applicationArgs: ['udVC+w==', null, null, null, 'AQ=='],
        }),
      ).toBeTruthy();
    });
  });
});
