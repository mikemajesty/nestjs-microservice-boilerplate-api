import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { z } from 'zod';

import { ApiInternalServerException } from '@/utils/exception';
import { ZodInferSchema } from '@/utils/zod';

import { LogLevelEnum } from '../logger';
import { ISecretsAdapter } from './adapter';
import { SecretsService } from './service';
import { EnvEnum } from './types';

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
        const SecretsSchema = z.object<ZodInferSchema<ISecretsAdapter>>({
          ENV: z.nativeEnum(EnvEnum),
          SYNC_DATABASE: z.string().or(z.boolean()).optional(),
          HOST: z.string(),
          IS_LOCAL: z.boolean(),
          IS_PRODUCTION: z.boolean(),
          JWT_SECRET_KEY: z.string(),
          LOG_LEVEL: z.nativeEnum(LogLevelEnum),
          DATE_FORMAT: z.string(),
          TZ: z.string(),
          MONGO: z.object({
            MONGO_URL: z.string(),
            MONGO_DATABASE: z.string(),
            MONGO_EXPRESS_URL: z.string().url()
          }),
          POSTGRES: z.object({
            POSTGRES_URL: z.string().url(),
            POSTGRES_PGADMIN_URL: z.string().url()
          }),
          PORT: z
            .number()
            .or(z.string())
            .transform((p) => Number(p)),
          PROMETHUES_URL: z.string().url(),
          REDIS_URL: z.string().url(),
          TOKEN_EXPIRATION: z.string(),
          REFRESH_TOKEN_EXPIRATION: z.string(),
          ZIPKIN_URL: z.string().url(),
          EMAIL: z.object({
            HOST: z.string(),
            PORT: z.number(),
            USER: z.string(),
            PASS: z.string(),
            FROM: z.string().email()
          }),
          AUTH: z.object({
            GOOGLE: z.object({
              CLIENT_ID: z.string(),
              CLIENT_SECRET: z.string(),
              REDIRECT_URL: z.string().url()
            })
          })
        });
        const secret = new SecretsService(config);

        try {
          SecretsSchema.parse(secret);
        } catch (error) {
          const message = error.issues.map((i) => `SecretsService.${i.path.join('.')}: ${i.message}`);
          throw new ApiInternalServerException({ ...error, message });
        }

        return SecretsSchema.parse(secret);
      },
      inject: [ConfigService]
    }
  ],
  exports: [ISecretsAdapter]
})
export class SecretsModule {}
