import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable, throwError, TimeoutError } from 'rxjs'
import { catchError, timeout } from 'rxjs/operators'

import { ApiTimeoutException } from '@/utils/exception'

const DEFAULT_FALLBACK_TIMEOUT = 1 * 60 * 1000

@Injectable()
export class RequestTimeoutInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly globalTimeout?: number
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const requestTimeout = this.reflector.getAllAndOverride<number>('request-timeout', [
      context.getHandler(),
      context.getClass()
    ])

    const finalTimeout = requestTimeout ?? this.globalTimeout ?? DEFAULT_FALLBACK_TIMEOUT

    return next.handle().pipe(
      timeout(finalTimeout),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          return throwError(() => new ApiTimeoutException(`Request Timeout. Limit: ${finalTimeout}ms exceeded.`))
        }
        return throwError(() => err)
      })
    )
  }
}
