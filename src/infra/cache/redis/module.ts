import { Module } from '@nestjs/common'
import { CachePlugin } from '@nestjs-redisx/cache'
import { RedisModule, RedisService as RedisXService } from '@nestjs-redisx/core'

import { ILoggerAdapter, LoggerModule } from '@/infra/logger'
import { ISecretsAdapter, SecretsModule } from '@/infra/secrets'

import { ICacheAdapter } from '../adapter'
import { RedisService } from './service'

/**
 * Owns the Redis connection and the cache plugin. Imported once by
 * `InfraModule`, never by feature modules, so tests that import a feature
 * module and stub `ICacheAdapter` never open a real connection.
 */
@Module({
  imports: [
    RedisModule.forRootAsync({
      imports: [SecretsModule],
      plugins: [new CachePlugin()],
      useFactory: ({ REDIS_URL }: ISecretsAdapter) => ({
        clients: { url: REDIS_URL },
        // node-redis keeps the @opentelemetry/instrumentation-redis-4 spans working
        global: { driver: 'node-redis' as const }
      }),
      inject: [ISecretsAdapter]
    })
  ]
})
export class RedisConnectionModule {}

@Module({
  imports: [LoggerModule, SecretsModule],
  providers: [
    {
      provide: ICacheAdapter,
      useFactory: async (client: RedisXService, logger: ILoggerAdapter) => {
        const cacheService = new RedisService(logger, client)
        await cacheService.connect()
        return cacheService
      },
      inject: [RedisXService, ILoggerAdapter]
    }
  ],
  exports: [ICacheAdapter]
})
export class RedisCacheModule {}
