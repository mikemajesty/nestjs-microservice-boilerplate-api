import { Module } from '@nestjs/common';

import { EventLibModule } from './event';
import { I18nLibModule } from './i18n';
import { TokenLibModule } from './token';

@Module({
  imports: [TokenLibModule, EventLibModule, I18nLibModule]
})
export class LibModule {}
