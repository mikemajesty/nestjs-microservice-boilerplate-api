import { TranslateOptions } from './types';

export abstract class II18nAdapter {
  abstract translate(key: string, options?: TranslateOptions): unknown;
}
