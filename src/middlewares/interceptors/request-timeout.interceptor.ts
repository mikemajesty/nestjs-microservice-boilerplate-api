/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/middlewares/request-timeout.interceptor.md
 */
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable, throwError, TimeoutError } from 'rxjs'
import { catchError, timeout } from 'rxjs/operators'

import { REQUEST_TIMEOUT_METADATA_KEY } from '@/utils/decorators'
import { ApiTimeoutException } from '@/utils/exception'
import { Deadline, runWithDeadline } from '@/utils/request/deadline'
import { TimeoutBudget } from '@/utils/request/timeout-budget'

@Injectable()
export class RequestTimeoutInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const requestTimeout = this.reflector.getAllAndOverride<number>(REQUEST_TIMEOUT_METADATA_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    const finalTimeout = requestTimeout ?? TimeoutBudget.HTTP_REQUEST_TIMEOUT_MS
    const deadline = Deadline.fromTimeout(finalTimeout)

    return runWithDeadline(deadline, () => next.handle()).pipe(
      timeout(finalTimeout),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          return throwError(
            () =>
              new ApiTimeoutException(`Request Timeout. Limit: ${finalTimeout}ms exceeded.`, {
                context: RequestTimeoutInterceptor.name,
                details: [`timeoutMs: ${finalTimeout}`]
              })
          )
        }
        return throwError(() => err)
      })
    )
  }
}
