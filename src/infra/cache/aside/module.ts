import { Module } from '@nestjs/common'

import { ILoggerAdapter, LoggerModule } from '@/infra/logger'

import { ICacheAdapter } from '../adapter'
import { CacheRedisModule } from '../redis'
import { ICacheAsideAdapter } from './adapter'
import { CacheAsideService } from './service'

@Module({
  imports: [LoggerModule, CacheRedisModule],
  providers: [
    {
      provide: ICacheAsideAdapter,
      useFactory: async (logger: ILoggerAdapter, redisCache: ICacheAdapter) => {
        const cacheService = new CacheAsideService(logger, redisCache)
        return cacheService
      },
      inject: [ILoggerAdapter, ICacheAdapter]
    }
  ],
  exports: [ICacheAsideAdapter]
})
export class CacheAsideModule {}
