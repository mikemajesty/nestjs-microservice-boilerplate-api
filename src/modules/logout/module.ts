/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/module.md
 */
import { Module } from '@nestjs/common'

import { LogoutUsecase } from '@/core/user/use-cases/user-logout'
import { ICacheAdapter } from '@/infra/cache'
import { CacheRedisModule } from '@/infra/cache/redis'
import { LoggerModule } from '@/infra/logger'
import { ISecretsAdapter, SecretsModule } from '@/infra/secrets'

import { TokenLibModule } from '../../libs/token/module'
import { LogoutController } from './controller'
import { ILogout } from './interfaces'

@Module({
  imports: [CacheRedisModule, SecretsModule, CacheRedisModule, TokenLibModule, LoggerModule],
  controllers: [LogoutController],
  providers: [
    {
      provide: ILogout,
      useFactory: (cache: ICacheAdapter, secrets: ISecretsAdapter) => {
        return new LogoutUsecase(cache, secrets)
      },
      inject: [ICacheAdapter, ISecretsAdapter]
    }
  ],
  exports: [ILogout]
})
export class LogoutModule {}
