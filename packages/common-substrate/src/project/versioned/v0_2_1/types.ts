// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {ProjectManifestV0_2_1, TemplateBase} from '@subql/common';
import {CustomDataSourceV0_2_0, RuntimeDataSourceV0_2_0} from '../v0_2_0';

// export interface DataSourceTemplate {
//   name: string;
// }

export interface RuntimeDataSourceTemplate extends Omit<RuntimeDataSourceV0_2_0, 'name'>, TemplateBase {}
export interface CustomDataSourceTemplate extends Omit<CustomDataSourceV0_2_0, 'name'>, TemplateBase {}

export type SubstrateProjectManifestV0_2_1 = ProjectManifestV0_2_1<
  RuntimeDataSourceTemplate | CustomDataSourceTemplate,
  RuntimeDataSourceV0_2_0 | CustomDataSourceV0_2_0
>;
