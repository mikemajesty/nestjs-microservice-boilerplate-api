/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/utils/validator.md
 */
import { AsyncLocalStorage } from 'node:async_hooks'

import { z } from 'zod'

import { LoggerService } from '@/infra/logger'

export const SUPPORTED_LOCALES = {
  'en-US': 'en',
  'pt-BR': 'pt',
  'es-ES': 'es'
} as const

type SupportedLocale = keyof typeof SUPPORTED_LOCALES

let defaultRequestLocale: SupportedLocale = 'en-US'

const localeStorage = new AsyncLocalStorage<SupportedLocale>()
const zodLocaleErrors = {
  'en-US': z.locales.en().localeError,
  'pt-BR': z.locales.pt().localeError,
  'es-ES': z.locales.es().localeError
} satisfies Record<SupportedLocale, z.core.$ZodErrorMap>

const requestLocaleError: z.core.$ZodErrorMap = (issue) => {
  const locale = localeStorage.getStore() || defaultRequestLocale
  return zodLocaleErrors[locale](issue)
}

export const initI18n = async (defaultLocale: SupportedLocale = 'en-US') => {
  defaultRequestLocale = defaultLocale
  z.config({ localeError: requestLocaleError })
  LoggerService.log(`i18n initialized with ${defaultLocale}`)
}

export const runWithRequestLocale = <T>(locale: SupportedLocale, callback: () => T): T => {
  return localeStorage.run(locale, callback)
}

export const Schema = {
  ...z
}

export const normalizeLocale = (locale: string): SupportedLocale => {
  const localeMap: Record<string, string> = {
    en: 'en-US',
    pt: 'pt-BR',
    es: 'es-ES',
    'pt-BR': 'pt-BR',
    'en-US': 'en-US',
    'es-ES': 'es-ES'
  }

  return (localeMap[`${locale}`] || 'en-US') as SupportedLocale
}

export type InferSchema<T extends z.ZodType> = z.infer<T>

export const ZodException = z.ZodError
export type ZodException = z.ZodError
export type ZodExceptionIssue = z.core.$ZodIssue

export type ZodOptionalType<T> = z.ZodOptional<z.ZodType<NonNullable<T>>>

export type {
  ZodType as BaseZodType,
  ZodAny,
  ZodArray,
  ZodBigInt,
  ZodBoolean,
  ZodCatch,
  ZodDate,
  ZodDefault,
  ZodDiscriminatedUnion,
  ZodEnum,
  ZodError,
  ZodFunction,
  ZodIntersection,
  ZodLazy,
  ZodLiteral,
  ZodMap,
  ZodNaN,
  ZodNever,
  ZodNull,
  ZodNullable,
  ZodNumber,
  ZodObject,
  ZodOptional,
  ZodPromise,
  ZodRecord,
  ZodSet,
  ZodString,
  ZodSymbol,
  ZodTuple,
  ZodUndefined,
  ZodUnion,
  ZodUnknown,
  ZodVoid
} from 'zod'
