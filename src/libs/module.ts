import { Module } from '@nestjs/common';

import { CryptoLibModule } from './crypto';
import { EventLibModule } from './event';
import { I18nLibModule } from './i18n';
import { TokenLibModule } from './token';

@Module({
  imports: [TokenLibModule, CryptoLibModule, EventLibModule, I18nLibModule]
})
export class LibModule {}
