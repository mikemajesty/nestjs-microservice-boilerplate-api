import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { ApiInternalServerException } from '@/utils/exception'
import { ZodInferSchema } from '@/utils/types'
import { InputValidator, ZodException, ZodExceptionIssue } from '@/utils/validator'

import { LogLevelEnum } from '../logger'
import { ISecretsAdapter } from './adapter'
import { SecretsService } from './service'
import { EnvEnum } from './types'

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env']
    })
  ],
  providers: [
    {
      provide: ISecretsAdapter,
      useFactory: (config: ConfigService) => {
        const SecretsSchema = InputValidator.object<ZodInferSchema<ISecretsAdapter>>({
          ENV: InputValidator.enum(EnvEnum),
          TIMEOUT: InputValidator.number()
            .or(InputValidator.string())
            .transform((p) => Number(p)),
          HOST: InputValidator.string(),
          IS_LOCAL: InputValidator.boolean(),
          IS_PRODUCTION: InputValidator.boolean(),
          JWT_SECRET_KEY: InputValidator.string(),
          LOG_LEVEL: InputValidator.enum(LogLevelEnum),
          DATE_FORMAT: InputValidator.string(),
          TZ: InputValidator.string(),
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
          TOKEN_EXPIRATION: InputValidator.string().or(InputValidator.number()),
          REFRESH_TOKEN_EXPIRATION: InputValidator.string().or(InputValidator.number()),
          ZIPKIN_URL: InputValidator.url(),
          EMAIL: InputValidator.object({
            HOST: InputValidator.string(),
            PORT: InputValidator.number(),
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
          })
        })
        const secret = new SecretsService(config)

        try {
          SecretsSchema.parse(secret)
        } catch (error) {
          const zodError = error as ZodException
          const message = zodError.issues
            .map((i: ZodExceptionIssue) => `${SecretsService.name}.${i.path.join('.')}: ${i.message}`)
            .join(',')
          console.error(new ApiInternalServerException(message, { context: SecretsService.name }))
          process.exit(1)
        }

        return SecretsSchema.parse(secret)
      },
      inject: [ConfigService]
    }
  ],
  exports: [ISecretsAdapter]
})
export class SecretsModule {}
