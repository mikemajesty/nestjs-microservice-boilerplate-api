/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/libs/i18n.md
 */
import { TranslateOptions } from './types'

export abstract class II18nAdapter {
  abstract translate(key: string, options?: TranslateOptions): unknown
}
