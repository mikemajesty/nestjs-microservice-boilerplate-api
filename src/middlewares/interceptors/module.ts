import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR, Reflector } from '@nestjs/core'

import { ILoggerAdapter, LoggerModule } from '@/infra/logger'

import {
  ExceptionHandlerInterceptor,
  HttpLoggerInterceptor,
  RequestTimeoutInterceptor,
  TracingInterceptor
} from './index'

@Module({
  imports: [LoggerModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useFactory(reflector: Reflector) {
        return new RequestTimeoutInterceptor(reflector)
      },
      inject: [Reflector]
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
      useFactory() {
        return new TracingInterceptor()
      }
    }
  ]
})
export class InterceptorsModule {}
