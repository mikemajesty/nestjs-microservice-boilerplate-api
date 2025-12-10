import i18next, { ResourceLanguage } from 'i18next';
import * as validatorBrasil from 'validator-brasil';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';

import { LoggerService } from '@/infra/logger';

const SUPPORTED_LOCALES = {
  'en-US': 'en',
  'pt-BR': 'pt',
  'es-ES': 'es'
} as const;

type SupportedLocale = keyof typeof SUPPORTED_LOCALES;

const translationCache = new Map<string, ResourceLanguage>();

async function loadTranslation(language: string): Promise<ResourceLanguage> {
  if (translationCache.has(language)) {
    return translationCache.get(language)!;
  }

  try {
    const module = await import(`zod-i18n-map/locales/${language}/zod.json`);
    translationCache.set(language, module.default);
    return module.default;
  } catch {
    LoggerService.log(`Translation for ${language} not found, using English fallback`);

    const en = await import('zod-i18n-map/locales/en/zod.json');
    translationCache.set(language, en.default);
    return en.default;
  }
}

async function preloadCommonTranslations() {
  const commonLanguages = ['en', 'pt', 'es'];
  await Promise.allSettled(commonLanguages.map((lang) => loadTranslation(lang)));
}

export const initI18n = async (defaultLocale: SupportedLocale = 'en-US') => {
  const defaultLanguage = SUPPORTED_LOCALES[`${defaultLocale}`];

  const defaultTranslation = await loadTranslation(defaultLanguage);

  await i18next.init({
    lng: defaultLanguage,
    fallbackLng: 'en',
    resources: {
      [`${defaultLanguage}`]: { zod: defaultTranslation }
    }
  });

  z.config(zodI18nMap as z.core.$ZodConfig);

  preloadCommonTranslations().then(() => {
    LoggerService.log('Common translations preloaded');
  });

  LoggerService.log(`i18n initialized with ${defaultLocale}`);
};

export const changeLanguage = async (locale: SupportedLocale) => {
  const language = SUPPORTED_LOCALES[`${locale}`];

  if (!language) {
    LoggerService.log(`Locale ${locale} not supported, keeping current language`);
    return;
  }

  await loadTranslation(language);
  await i18next.changeLanguage(language);
  z.config(zodI18nMap as z.core.$ZodConfig);
};

const validateRG = (rg: string): boolean => {
  const cleanedRG = rg.replace(/\D/g, '');
  return cleanedRG.length >= 7 && cleanedRG.length <= 9;
};

const validatePhoneBR = (telefone: string): boolean => {
  const phone = telefone.replace(/\D/g, '');

  if (phone.length === 11) {
    return /^[1-9]{2}9[0-9]{8}$/.test(phone);
  }

  if (phone.length === 10) {
    return /^[1-9]{2}[2-5][0-9]{7}$/.test(phone);
  }

  return false;
};

const createBrazilValidator = <T extends string>(validator: (value: string) => boolean, format: T) => {
  return z
    .string()
    .min(1, 'Required field')
    .transform((val) => val.replace(/\D/g, ''))
    .refine(validator, {
      message: `Invalid ${format}`
    })
    .meta({ format });
};

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
};

export const normalizeLocale = (locale: string): string => {
  const localeMap: Record<string, string> = {
    en: 'en-US',
    pt: 'pt-BR',
    es: 'es-ES',
    'pt-BR': 'pt-BR',
    'en-US': 'en-US',
    'es-ES': 'es-ES'
  };

  return localeMap[`${locale}`] || 'en-US';
};

export type Infer<T extends z.ZodType> = z.infer<T>;
export type ZodException = z.ZodError;
export type ZodExceptionIssue = z.core.$ZodIssue;

export type ZodOptionalType<T> = z.ZodOptional<z.ZodType<NonNullable<T>>>;

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
} from 'zod';
