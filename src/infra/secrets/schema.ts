import { LogLevelEnum } from '@/infra/logger'
import { Schema } from '@/utils/schema'
import { ZodInferSchema } from '@/utils/types'

import { ISecretsAdapter } from './adapter'
import { EnvEnum } from './types'

export const SecretsSchema = () =>
  Schema.object<ZodInferSchema<ISecretsAdapter>>({
    ENV: Schema.enum(EnvEnum),
    HTTP_REQUEST_TIMEOUT_MS: Schema.number()
      .or(Schema.string())
      .transform((p) => Number(p))
      .refine((timeout) => Number.isInteger(timeout) && timeout > 0, {
        message: 'timeoutMustBePositiveInteger'
      })
      .default(5000),
    HOST: Schema.string(),
    IS_LOCAL: Schema.boolean(),
    IS_DOCUMENTDB: Schema.boolean().optional(),
    IS_PRODUCTION: Schema.boolean(),
    JWT_SECRET_KEY: Schema.string(),
    LOG_LEVEL: Schema.enum(LogLevelEnum),
    DATE_FORMAT: Schema.string(),
    MONGO: Schema.object({
      MONGO_URL: Schema.string(),
      MONGO_DATABASE: Schema.string(),
      MONGO_EXPRESS_URL: Schema.string().url()
    }),
    POSTGRES: Schema.object({
      POSTGRES_URL: Schema.string().url(),
      POSTGRES_PGADMIN_URL: Schema.string().url()
    }),
    PORT: Schema.number()
      .or(Schema.string())
      .transform((p) => Number(p)),
    PROMETHUES_URL: Schema.url(),
    GRAFANA_URL: Schema.url(),
    REDIS_URL: Schema.url(),
    TOKEN_EXPIRATION: Schema.number()
      .or(Schema.string())
      .transform((p) => Number(p)),
    REFRESH_TOKEN_EXPIRATION: Schema.number()
      .or(Schema.string())
      .transform((p) => Number(p)),
    ZIPKIN_URL: Schema.url(),
    EMAIL: Schema.object({
      HOST: Schema.string(),
      PORT: Schema.number()
        .or(Schema.string())
        .transform((p) => Number(p)),
      USER: Schema.string(),
      PASS: Schema.string(),
      FROM: Schema.email()
    }),
    AUTH: Schema.object({
      GOOGLE: Schema.object({
        CLIENT_ID: Schema.string(),
        CLIENT_SECRET: Schema.string(),
        REDIRECT_URL: Schema.url()
      })
    }),
    JWT_REFRESH_SECRET_KEY: Schema.string()
  })
