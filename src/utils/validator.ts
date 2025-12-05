import i18next, { ResourceLanguage } from 'i18next';
import * as validatorBrasil from 'validator-brasil';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';

import { LoggerService } from '@/infra/logger';

const languageRegionMap: Record<string, LocaleInput> = {
  'ar-SA': 'ar',
  'cs-CZ': 'cs',
  'en-US': 'en',
  'fa-IR': 'fa',
  'fr-FR': 'fr',
  'hr-HR': 'hr-HR',
  'is-IS': 'is',
  'ja-JP': 'ja',
  'lt-LT': 'lt',
  'nl-NL': 'nl',
  'pt-BR': 'pt',
  'ru-RU': 'ru',
  'sv-SE': 'sv',
  'uk-UA': 'uk-UA',
  'zh-CN': 'zh-CN',
  'bg-BG': 'bg',
  'de-DE': 'de',
  'es-ES': 'es',
  'fi-FI': 'fi',
  'he-IL': 'he',
  'id-ID': 'id',
  'it-IT': 'it',
  'ko-KR': 'ko',
  'nb-NO': 'nb',
  'pl-PL': 'pl',
  'ro-RO': 'ro',
  'sk-SK': 'sk',
  'tr-TR': 'tr',
  'uz-UZ': 'uz',
  'zh-TW': 'zh-TW'
};

const languageRegionMapCache: Record<string, ResourceLanguage> = {};

export async function loadTranslations() {
  const translationPromises = Object.entries(languageRegionMap).map(async ([region, language]) => {
    try {
      const translationModule = await import(`zod-i18n-map/locales/${language}/zod.json`);
      languageRegionMapCache[`${region}`] = translationModule.default;
    } catch (error) {
      console.error(`Error loading translation for ${region}:`, error);
    }
  });

  await Promise.all(translationPromises);
  LoggerService.log('All translations have been loaded.');
}

export const initI18n = async (defaultLocale = 'en-US') => {
  await loadTranslations();

  const resources = Object.entries(languageRegionMapCache).reduce(
    (acc, [region, translation]) => {
      const language = languageRegionMap[`${region}`];
      if (language) {
        acc[`${language}`] = { zod: translation };
      }
      return acc;
    },
    {} as Record<string, { zod: ResourceLanguage }>
  );

  await i18next.init({
    lng: languageRegionMap[`${defaultLocale}`],
    fallbackLng: 'en',
    resources
  });

  z.config(zodI18nMap as z.core.$ZodConfig);
};

export const changeLanguage = async (locale: string) => {
  const language = languageRegionMap[`${locale}`];

  if (language) {
    await i18next.changeLanguage(language);
    z.config(zodI18nMap as z.core.$ZodConfig);
  } else {
    console.error(`Language for region ${locale} not found.`);
  }
};

const validateRG = (rg: string): boolean => {
  const cleanedRG = rg.replace(/\D/g, '');
  return cleanedRG.length === 9;
};

const validateCPF = (cpf: string): boolean => {
  return validatorBrasil.isCPF(cpf);
};

const validateCNPJ = (cnpj: string): boolean => {
  return validatorBrasil.isCNPJ(cnpj);
};

const validatePhone = (telefone: string): boolean => {
  const phone = telefone.replace(/\D/g, '');
  return phone.length >= 10 && phone.length <= 11;
};

const validateCEP = (cep: string): boolean => {
  return validatorBrasil.isCEP(cep);
};

export const InputValidator = {
  ...z,
  cpf: () =>
    z
      .string()
      .transform((val) => val.replace(/\D/g, ''))
      .refine(validateCPF, {
        message: 'invalid CPF'
      })
      .meta({ format: 'cpf' }),
  rg: () =>
    z
      .string()
      .transform((val) => val.replace(/\D/g, ''))
      .refine(validateRG, {
        message: 'invalid RG'
      })
      .meta({ format: 'rg' }),
  cnpj: () =>
    z
      .string()
      .transform((val) => val.replace(/\D/g, ''))
      .refine(validateCNPJ, {
        message: 'invalid CNPJ'
      })
      .meta({ format: 'cnpj' }),

  phoneBR: () =>
    z
      .string()
      .transform((val) => val.replace(/\D/g, ''))
      .refine(validatePhone, {
        message: 'Phone must have 10 or 11 digits'
      })
      .meta({ format: 'phoneBR' }),

  cep: () =>
    z
      .string()
      .transform((val) => val.replace(/\D/g, ''))
      .refine(validateCEP, {
        message: 'invalid CEP'
      })
      .meta({ format: 'cep' })
};

export type LocaleInput =
  | 'ar'
  | 'cs'
  | 'en'
  | 'fa'
  | 'fr'
  | 'hr-HR'
  | 'is'
  | 'ja'
  | 'lt'
  | 'nl'
  | 'pt'
  | 'ru'
  | 'sv'
  | 'uk-UA'
  | 'zh-CN'
  | 'bg'
  | 'de'
  | 'es'
  | 'fi'
  | 'he'
  | 'id'
  | 'it'
  | 'ko'
  | 'nb'
  | 'pl'
  | 'ro'
  | 'sk'
  | 'tr'
  | 'uz'
  | 'zh-TW';

export type Infer<T extends z.ZodType> = z.infer<T>;

export type ZodException = z.ZodError;
export type ZodExceptionIssue = z.core.$ZodIssue;

export type ZodOptionalType<T> = z.ZodOptional<z.ZodType<NonNullable<T>>>;

export type ZodOptionalPipeline<T> = z.core.$ZodPipe<z.ZodOptional<z.ZodType<unknown>>, z.ZodType<T>>;

export type ZodSchema<T> = z.ZodType<T> | z.core.$ZodPipe<z.ZodType<unknown>, z.ZodType<T>>;
