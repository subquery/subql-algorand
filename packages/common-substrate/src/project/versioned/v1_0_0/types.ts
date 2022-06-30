// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {ProjectManifestV1_0_0} from '@subql/common';
import {CustomDataSourceV0_2_0, RuntimeDataSourceV0_2_0} from '../v0_2_0';
import {RuntimeDataSourceTemplate, CustomDataSourceTemplate} from '../v0_2_1';

export type SubstrateProjectManifestV1_0_0 = ProjectManifestV1_0_0<
  RuntimeDataSourceTemplate | CustomDataSourceTemplate,
  RuntimeDataSourceV0_2_0 | CustomDataSourceV0_2_0
>;
