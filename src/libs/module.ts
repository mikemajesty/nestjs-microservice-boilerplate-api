import { Module } from '@nestjs/common';

import { EventLibModule } from './event';
import { I18nLibModule } from './i18n';
import { MetricsLibModule } from './metrics';
import { TokenLibModule } from './token';

@Module({
  imports: [TokenLibModule, EventLibModule, I18nLibModule, MetricsLibModule]
})
export class LibModule {}
