import { Module } from '@nestjs/common';

import { HealthController } from './controller';

@Module({
  controllers: [HealthController]
})
export class HealthModule {}
