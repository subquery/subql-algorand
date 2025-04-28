// Copyright 2020-2025 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import {registerDecorator, ValidationOptions} from 'class-validator';

export function IsStringOrObject(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsStringOrObject',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          return typeof value === 'string' || (typeof value === 'object' && Object.keys(value).length > 0);
        },
        defaultMessage() {
          throw new Error(`${propertyName} must by string or object!`);
        },
      },
    });
  };
}
