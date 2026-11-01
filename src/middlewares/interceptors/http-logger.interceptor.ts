/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/middlewares/http-logger.interceptor.md
 */
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable } from 'rxjs'

import { AppFastifyRequest, ensureTraceId } from '@/utils/request'

@Injectable()
export class HttpLoggerInterceptor implements NestInterceptor {
  intercept(executionContext: ExecutionContext, next: CallHandler): Observable<unknown> {
    const context = `${executionContext.getClass().name}.${executionContext.getHandler().name}`

    const request = executionContext.switchToHttp().getRequest<AppFastifyRequest>()

    request.context = context

    ensureTraceId(request)

    return next.handle()
  }
}
