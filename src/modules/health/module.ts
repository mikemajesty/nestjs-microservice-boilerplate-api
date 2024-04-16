import { Module } from '@nestjs/common';

import { I18nLibModule } from '@/libs/i18n';

import { HealthController } from './controller';

@Module({
  imports: [I18nLibModule],
  controllers: [HealthController]
})
export class HealthModule {}
