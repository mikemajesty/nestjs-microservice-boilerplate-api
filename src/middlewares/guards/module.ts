import { Module } from '@nestjs/common'
import { APP_GUARD, Reflector } from '@nestjs/core'

import { IRoleRepository } from '@/core/role/repository/role'
import { IUserRepository } from '@/core/user/repository/user'
import { ICacheAdapter } from '@/infra/cache'
import { CacheAsideModule, ICacheAsideAdapter } from '@/infra/cache/aside'
import { CacheRedisModule } from '@/infra/cache/redis'
import { LoggerModule } from '@/infra/logger'
import { ITokenAdapter, TokenLibModule } from '@/libs/token'
import { RoleModule } from '@/modules/role/module'
import { UserModule } from '@/modules/user/module'

import { AuthenticationGuard, AuthorizationGuard } from './index'

@Module({
  imports: [CacheRedisModule, TokenLibModule, LoggerModule, UserModule, CacheAsideModule, RoleModule],
  providers: [
    {
      provide: APP_GUARD,
      useFactory: (token: ITokenAdapter, cache: ICacheAdapter) => {
        return new AuthenticationGuard(new Reflector(), token, cache)
      },
      inject: [ITokenAdapter, ICacheAdapter]
    },
    {
      provide: APP_GUARD,
      useFactory: (repository: IUserRepository, cacheAside: ICacheAsideAdapter, roleRepository: IRoleRepository) => {
        return new AuthorizationGuard(new Reflector(), repository, cacheAside, roleRepository)
      },
      inject: [IUserRepository, ICacheAsideAdapter, IRoleRepository]
    }
  ]
})
export class GuardsModule {}
