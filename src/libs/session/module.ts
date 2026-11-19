import { Module } from '@nestjs/common'
import { Redis } from 'ioredis'

import { ICacheAdapter } from '@/infra/cache'
import { CacheRedisModule } from '@/infra/cache/redis'
import { ITokenAdapter, TokenLibModule } from '@/libs/token'

import { ISessionAdapter } from './adapter'
import { SessionService } from './service'

@Module({
  imports: [TokenLibModule, CacheRedisModule],
  providers: [
    {
      provide: ISessionAdapter,
      useFactory: (token: ITokenAdapter, cache: ICacheAdapter<Redis>) => new SessionService(token, cache),
      inject: [ITokenAdapter, ICacheAdapter]
    }
  ],
  exports: [ISessionAdapter]
})
export class SessionLibModule {}
