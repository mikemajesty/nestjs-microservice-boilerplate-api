/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/utils/validator.md
 */
import { AsyncLocalStorage } from 'node:async_hooks'

import * as validatorBrasil from 'validator-brasil'
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

const validateRG = (rg: string): boolean => {
  const cleanedRG = rg.replace(/\D/g, '')
  return cleanedRG.length >= 7 && cleanedRG.length <= 9
}

const validatePhoneBR = (telefone: string): boolean => {
  const phone = telefone.replace(/\D/g, '')

  if (phone.length === 11) {
    return /^[1-9]{2}9[0-9]{8}$/.test(phone)
  }

  if (phone.length === 10) {
    return /^[1-9]{2}[2-5][0-9]{7}$/.test(phone)
  }

  return false
}

const createBrazilValidator = <T extends string>(validator: (value: string) => boolean, format: T) => {
  return z
    .string()
    .min(1, 'Required field')
    .transform((val) => val.replace(/\D/g, ''))
    .refine(validator, {
      message: `Invalid ${format}`
    })
    .meta({ format })
}

export const InputValidator = {
  ...z,
  cpf: () => createBrazilValidator(validatorBrasil.isCPF, 'cpf'),
  cnpj: () => createBrazilValidator(validatorBrasil.isCNPJ, 'cnpj'),
  rg: () => createBrazilValidator(validateRG, 'rg'),
  phoneBR: () => createBrazilValidator(validatePhoneBR, 'phoneBR'),
  cep: () => createBrazilValidator(validatorBrasil.isCEP, 'cep'),

  phone: () =>
    z
      .string()
      .transform((val) => val.replace(/\D/g, ''))
      .refine((val) => val.length >= 8 && val.length <= 15, {
        message: 'Invalid phone number'
      })
      .meta({ format: 'phone' })
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

export type Infer<T extends z.ZodType> = z.infer<T>
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
