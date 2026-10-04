import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { ApiInternalServerException } from '@/utils/exception'
import { ZodException, ZodExceptionIssue } from '@/utils/validator'

import { ISecretsAdapter } from './adapter'
import { SecretsSchema } from './schema'
import { SecretsService } from './service'

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
        const secrets = new SecretsService(config).build()
        const secretsSchema = SecretsSchema()

        try {
          return Object.freeze(secretsSchema.parse(secrets))
        } catch (error) {
          const zodError = error as ZodException
          const message = zodError.issues
            .map((i: ZodExceptionIssue) => `${SecretsService.name}.${i.path.join('.')}: ${i.message}`)
            .join(',')
          console.error(new ApiInternalServerException(message, { context: SecretsService.name }))
          process.exit(1)
        }
      },
      inject: [ConfigService]
    }
  ],
  exports: [ISecretsAdapter]
})
export class SecretsModule {}
