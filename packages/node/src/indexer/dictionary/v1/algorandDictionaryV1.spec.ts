// Copyright 2020-2024 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import { NodeConfig } from '@subql/node-core';
import { AlgorandDictionaryV1 } from './algorandDictionaryV1';

describe('dictionary service', () => {
  let dictionary: AlgorandDictionaryV1;

  beforeEach(async () => {
    dictionary = await AlgorandDictionaryV1.create(
      {
        network: {
          chainId: 'wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=',
          dictionary:
            'https://api.subquery.network/sq/subquery/Algorand-Dictionary',
        },
      } as any,
      { dictionaryTimeout: 10000 } as NodeConfig,
      jest.fn(),
      'https://api.subquery.network/sq/subquery/Algorand-Dictionary',
    );
  });

  it('successfully validates metatada', () => {
    expect(dictionary.metadataValid).toBeTruthy();
  });
});
