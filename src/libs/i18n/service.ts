import { Injectable } from '@nestjs/common';
import { I18nContext, I18nService as Service } from 'nestjs-i18n';

import { II18nAdapter } from './adapter';
import { TranslateOptions } from './types';

@Injectable()
export class I18nService implements II18nAdapter {
  constructor(private readonly i18n: Service) {}

  translate(key: string, options: TranslateOptions = {}): unknown {
    Object.assign(options, { lang: I18nContext.current().lang });
    return this.i18n.translate(key, options);
  }
}
