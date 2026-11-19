/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/module.md
 */
import { Module } from '@nestjs/common'

import { IUserRepository } from '@/core/user/repository/user'
import { LoginUsecase } from '@/core/user/use-cases/user-login'
import { RefreshTokenUsecase } from '@/core/user/use-cases/user-refresh-token'
import { HttpModule } from '@/infra/http'
import { SecretsModule } from '@/infra/secrets'
import { ISessionAdapter, SessionLibModule } from '@/libs/session'
import { TokenLibModule } from '@/libs/token'

import { UserModule } from '../user/module'
import { LoginController } from './controller'
import { ILogin, IRefreshToken } from './interfaces'

@Module({
  imports: [TokenLibModule, SessionLibModule, UserModule, SecretsModule, HttpModule],
  controllers: [LoginController],
  providers: [
    {
      provide: ILogin,
      useFactory: (repository: IUserRepository, session: ISessionAdapter) => {
        return new LoginUsecase(repository, session)
      },
      inject: [IUserRepository, ISessionAdapter]
    },
    {
      provide: IRefreshToken,
      useFactory: (repository: IUserRepository, session: ISessionAdapter) => {
        return new RefreshTokenUsecase(repository, session)
      },
      inject: [IUserRepository, ISessionAdapter]
    }
  ]
})
export class LoginModule {}
