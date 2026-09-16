import { Module } from '@nestjs/common'
import Redis from 'ioredis'

import { ILoggerAdapter, LoggerModule } from '@/infra/logger'
import { ISecretsAdapter, SecretsModule } from '@/infra/secrets'

import { ICacheAdapter } from '../adapter'
import { CacheRedisService } from './service'

@Module({
  imports: [LoggerModule, SecretsModule],
  providers: [
    {
      provide: ICacheAdapter,
      useFactory: async ({ REDIS_URL }: ISecretsAdapter, logger: ILoggerAdapter) => {
        const client = new Redis(REDIS_URL, {
          tls: REDIS_URL.startsWith('rediss://') ? {} : undefined,
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: false
        })

        const cacheService = new CacheRedisService(logger, client)
        await cacheService.connect()
        return cacheService
      },
      inject: [ISecretsAdapter, ILoggerAdapter]
    }
  ],
  exports: [ICacheAdapter]
})
export class CacheRedisModule {}
