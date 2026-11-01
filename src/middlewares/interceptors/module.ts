import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR, Reflector } from '@nestjs/core'

import {
  ExceptionHandlerInterceptor,
  HttpLoggerInterceptor,
  RequestTimeoutInterceptor,
  TracingInterceptor
} from './index'

@Module({
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
      useFactory() {
        return new HttpLoggerInterceptor()
      }
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
