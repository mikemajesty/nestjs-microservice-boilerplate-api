import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR, Reflector } from '@nestjs/core'

import { ILoggerAdapter, LoggerModule } from '@/infra/logger'
import { ISecretsAdapter, SecretsModule } from '@/infra/secrets'

import {
  ExceptionHandlerInterceptor,
  HttpLoggerInterceptor,
  RequestTimeoutInterceptor,
  TracingInterceptor
} from './index'

@Module({
  imports: [LoggerModule, SecretsModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useFactory(reflector: Reflector, secret: ISecretsAdapter) {
        return new RequestTimeoutInterceptor(reflector, secret.HTTP_REQUEST_TIMEOUT_MS)
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
    }
  ]
})
export class InterceptorsModule {}
