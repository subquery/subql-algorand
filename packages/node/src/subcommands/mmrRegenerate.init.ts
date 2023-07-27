// Copyright 2020-2023 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: GPL-3.0

import { NestFactory } from '@nestjs/core';
import { getLogger, MmrRegenerateService } from '@subql/node-core';
import { MmrRegenerateModule } from './mmrRegenerate.module';

const logger = getLogger('MMR-Regeneration');

export async function mmrRegenerateInit(
  probeMode = false,
  resetOnly = false,
  unsafe = false,
  targetHeight?: number,
): Promise<void> {
  try {
    const app = await NestFactory.create(MmrRegenerateModule);
    await app.init();
    const mmrRegenerateService = app.get(MmrRegenerateService);
    app.enableShutdownHooks();
    await mmrRegenerateService.init();
    if (!probeMode) {
      await mmrRegenerateService.regenerate(targetHeight, resetOnly, unsafe);
    }
  } catch (e) {
    logger.error(e, 'Re-generate MMR failed to execute');
    process.exit(1);
  }
  process.exit(0);
}
