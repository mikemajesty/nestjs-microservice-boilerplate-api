import { Module } from '@nestjs/common';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import path from 'path';

import { II18nAdapter } from './adapter';
import { I18nService } from './service';

@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/languages'),
        watch: false
      },
      resolvers: [{ use: QueryResolver, options: ['lang'] }, AcceptLanguageResolver]
    })
  ],
  providers: [
    {
      provide: II18nAdapter,
      useClass: I18nService
    }
  ],
  exports: [II18nAdapter]
})
export class I18nLibModule {}
