/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/module.md
 */
import { Module } from '@nestjs/common'

import { IUserRepository } from '@/core/user/repository/user'
import { LoginUsecase } from '@/core/user/use-cases/user-login'
import { RefreshTokenUsecase } from '@/core/user/use-cases/user-refresh-token'
import { HttpModule } from '@/infra/http'
import { SecretsModule } from '@/infra/secrets'
import { ITokenAdapter, TokenLibModule } from '@/libs/token'

import { UserModule } from '../user/module'
import { LoginController } from './controller'
import { ILogin, IRefreshToken } from './interfaces'

@Module({
  imports: [TokenLibModule, UserModule, SecretsModule, HttpModule, UserModule],
  controllers: [LoginController],
  providers: [
    {
      provide: ILogin,
      useFactory: (repository: IUserRepository, tokenService: ITokenAdapter) => {
        return new LoginUsecase(repository, tokenService)
      },
      inject: [IUserRepository, ITokenAdapter]
    },
    {
      provide: IRefreshToken,
      useFactory: (repository: IUserRepository, tokenService: ITokenAdapter) => {
        return new RefreshTokenUsecase(repository, tokenService)
      },
      inject: [IUserRepository, ITokenAdapter]
    }
  ]
})
export class LoginModule {}
