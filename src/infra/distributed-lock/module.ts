import { Module } from '@nestjs/common'

import { ICacheAdapter } from '../cache'
import { CacheRedisModule } from '../cache/redis'
import { IDistributedLockAdapter } from './adapter'
import { DistributedLockService } from './service'

@Module({
  imports: [CacheRedisModule],
  providers: [
    {
      provide: IDistributedLockAdapter,
      useFactory: (cache: ICacheAdapter) => {
        return new DistributedLockService(cache)
      },
      inject: [ICacheAdapter]
    }
  ],
  exports: [IDistributedLockAdapter]
})
export class DistributedLockModule {}
