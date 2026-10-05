import { LogLevelEnum } from '@/infra/logger'
import { ZodInferSchema } from '@/utils/types'
import { InputValidator } from '@/utils/validator'

import { ISecretsAdapter } from './adapter'
import { EnvEnum } from './types'

export const SecretsSchema = () =>
  InputValidator.object<ZodInferSchema<ISecretsAdapter>>({
    ENV: InputValidator.enum(EnvEnum),
    HTTP_REQUEST_TIMEOUT_MS: InputValidator.number()
      .or(InputValidator.string())
      .transform((p) => Number(p))
      .refine((timeout) => Number.isInteger(timeout) && timeout > 0, {
        message: 'timeoutMustBePositiveInteger'
      }),
    HOST: InputValidator.string(),
    IS_LOCAL: InputValidator.boolean(),
    IS_DOCUMENTDB: InputValidator.boolean().optional(),
    IS_PRODUCTION: InputValidator.boolean(),
    JWT_SECRET_KEY: InputValidator.string(),
    LOG_LEVEL: InputValidator.enum(LogLevelEnum),
    DATE_FORMAT: InputValidator.string(),
    MONGO: InputValidator.object({
      MONGO_URL: InputValidator.string(),
      MONGO_DATABASE: InputValidator.string(),
      MONGO_EXPRESS_URL: InputValidator.string().url()
    }),
    POSTGRES: InputValidator.object({
      POSTGRES_URL: InputValidator.string().url(),
      POSTGRES_PGADMIN_URL: InputValidator.string().url()
    }),
    PORT: InputValidator.number()
      .or(InputValidator.string())
      .transform((p) => Number(p)),
    PROMETHUES_URL: InputValidator.url(),
    GRAFANA_URL: InputValidator.url(),
    REDIS_URL: InputValidator.url(),
    TOKEN_EXPIRATION: InputValidator.number()
      .or(InputValidator.string())
      .transform((p) => Number(p)),
    REFRESH_TOKEN_EXPIRATION: InputValidator.number()
      .or(InputValidator.string())
      .transform((p) => Number(p)),
    ZIPKIN_URL: InputValidator.url(),
    EMAIL: InputValidator.object({
      HOST: InputValidator.string(),
      PORT: InputValidator.number()
        .or(InputValidator.string())
        .transform((p) => Number(p)),
      USER: InputValidator.string(),
      PASS: InputValidator.string(),
      FROM: InputValidator.email()
    }),
    AUTH: InputValidator.object({
      GOOGLE: InputValidator.object({
        CLIENT_ID: InputValidator.string(),
        CLIENT_SECRET: InputValidator.string(),
        REDIRECT_URL: InputValidator.url()
      })
    }),
    JWT_REFRESH_SECRET_KEY: InputValidator.string()
  })
