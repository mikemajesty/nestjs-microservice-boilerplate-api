import { Module } from '@nestjs/common';

import { HttpModule } from '@/infra/http';

import { HealthController } from './controller';

@Module({
  imports: [HttpModule],
  controllers: [HealthController]
})
export class HealthModule {}
