import { Module } from '@nestjs/common'
import { APP_GUARD, Reflector } from '@nestjs/core'

import { IRoleRepository } from '@/core/role/repository/role'
import { IUserRepository } from '@/core/user/repository/user'
import { CacheAsideModule, ICacheAsideAdapter } from '@/infra/cache/aside'
import { CacheRedisModule } from '@/infra/cache/redis'
import { LoggerModule } from '@/infra/logger'
import { ISessionAdapter, SessionLibModule } from '@/libs/session'
import { ITokenAdapter, TokenLibModule } from '@/libs/token'
import { RoleModule } from '@/modules/role/module'
import { UserModule } from '@/modules/user/module'

import { AuthenticationGuard, AuthorizationGuard } from './index'

@Module({
  imports: [CacheRedisModule, TokenLibModule, SessionLibModule, LoggerModule, UserModule, CacheAsideModule, RoleModule],
  providers: [
    {
      provide: APP_GUARD,
      useFactory: (token: ITokenAdapter, session: ISessionAdapter) => {
        return new AuthenticationGuard(new Reflector(), token, session)
      },
      inject: [ITokenAdapter, ISessionAdapter]
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
