import { Module } from '@nestjs/common';

import { HealthController } from './controller';
import { HttpModule } from '@/infra/http';

@Module({
  imports: [HttpModule],
  controllers: [HealthController]
})
export class HealthModule {}
