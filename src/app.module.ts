import { Module } from '@nestjs/common'
import { APP_GUARD, APP_INTERCEPTOR, Reflector } from '@nestjs/core'

import { IUserRepository } from '@/core/user/repository/user'
import { ICacheAdapter } from '@/infra/cache'
import { ILoggerAdapter, LoggerModule } from '@/infra/logger'
import { InfraModule } from '@/infra/module'
import { ISecretsAdapter } from '@/infra/secrets'
import { ITokenAdapter } from '@/libs/token'
import { AuthorizationRoleGuard } from '@/middlewares/guards'
import { BirdModule } from '@/modules/bird/module'
import { CatModule } from '@/modules/cat/module'
import { HealthModule } from '@/modules/health/module'
import { LoginModule } from '@/modules/login/module'
import { LogoutModule } from '@/modules/logout/module'
import { UserModule } from '@/modules/user/module'

import { LibModule } from './libs/module'
import {
  ExceptionHandlerInterceptor,
  HttpLoggerInterceptor,
  MetricsInterceptor,
  RequestTimeoutInterceptor,
  TracingInterceptor
} from './middlewares/interceptors'
import { AlertModule } from './modules/alert/module'
import { PermissionModule } from './modules/permission/module'
import { ResetPasswordModule } from './modules/reset-password/module'
import { RoleModule } from './modules/role/module'

@Module({
  imports: [
    InfraModule,
    LibModule,
    HealthModule,
    AlertModule,
    UserModule,
    LoginModule,
    LogoutModule,
    CatModule,
    ResetPasswordModule,
    RoleModule,
    PermissionModule,
    LoggerModule,
    BirdModule
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useFactory(reflector: Reflector, secret: ISecretsAdapter) {
        return new RequestTimeoutInterceptor(reflector, secret.TIMEOUT)
      },
      inject: [Reflector, ISecretsAdapter]
    },
    {
      provide: APP_INTERCEPTOR,
      useFactory() {
        return new ExceptionHandlerInterceptor()
      }
    },
    {
      provide: APP_INTERCEPTOR,
      useFactory(logger: ILoggerAdapter) {
        return new HttpLoggerInterceptor(logger)
      },
      inject: [ILoggerAdapter]
    },
    {
      provide: APP_INTERCEPTOR,
      useFactory(logger: ILoggerAdapter) {
        return new TracingInterceptor(logger)
      },
      inject: [ILoggerAdapter]
    },
    {
      provide: APP_INTERCEPTOR,
      useFactory() {
        return new MetricsInterceptor()
      }
    },
    {
      provide: APP_GUARD,
      useFactory: (repository: IUserRepository, tokenService: ITokenAdapter, cache: ICacheAdapter) => {
        return new AuthorizationRoleGuard(new Reflector(), repository, tokenService, cache)
      },
      inject: [IUserRepository, ITokenAdapter, ICacheAdapter]
    }
  ]
})
export class AppModule {}
