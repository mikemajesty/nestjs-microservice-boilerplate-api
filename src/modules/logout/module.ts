/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/module.md
 */
import { Module } from '@nestjs/common'

import { LogoutUsecase } from '@/core/user/use-cases/user-logout'
import { ICacheAdapter } from '@/infra/cache'
import { CacheRedisModule } from '@/infra/cache/redis'
import { ITokenAdapter } from '@/libs/token'

import { TokenLibModule } from '../../libs/token/module'
import { LogoutController } from './controller'
import { ILogout } from './interfaces'

@Module({
  imports: [CacheRedisModule, TokenLibModule],
  controllers: [LogoutController],
  providers: [
    {
      provide: ILogout,
      useFactory: (cache: ICacheAdapter, token: ITokenAdapter) => {
        return new LogoutUsecase(cache, token)
      },
      inject: [ICacheAdapter, ITokenAdapter]
    }
  ],
  exports: [ILogout]
})
export class LogoutModule {}
