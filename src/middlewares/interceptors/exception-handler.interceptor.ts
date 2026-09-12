/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/middlewares/exception-handler.interceptor.md
 */
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { SpanStatusCode } from '@opentelemetry/api'
import { AxiosError } from 'axios'
import { Observable } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { ZodError } from 'zod'

import { NETWORK_RETRY_CODES } from '@/utils/axios'
import {
  ApiBadRequestException,
  ApiExternalRequestException,
  ApiInternalServerException,
  ApiTimeoutException
} from '@/utils/exception'
import { ObjectUtils } from '@/utils/object'
import { AppFastifyRequest } from '@/utils/request'
import { AnyType } from '@/utils/types'

@Injectable()
export class ExceptionHandlerInterceptor implements NestInterceptor {
  intercept(executionContext: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      catchError((error: AnyType) => {
        const exception = this.toException(error)

        const request = executionContext.switchToHttp().getRequest<AppFastifyRequest>()

        if (typeof exception === 'object' && !exception.traceid) {
          exception.traceid = request.headers.traceid as string
        }

        if (!exception?.context) {
          const context = `${executionContext.getClass().name}.${executionContext.getHandler().name}`
          exception.context = context
        }

        if (request?.tracing) {
          const statusCode = typeof exception.getStatus === 'function' ? exception.getStatus() : exception.status

          request.tracing.addAttribute('http.status_code', statusCode)
          request.tracing.setStatus({ message: exception.message, code: SpanStatusCode.ERROR })
          request.tracing.addAttribute('error.message', exception.message)
          request.tracing.finish()
        }

        throw exception
      })
    )
  }

  private toException(error: ZodError | AxiosError<ExternalErrorResponse> | AnyType): AnyType {
    if (error?.isAxiosError) {
      return this.toExternalRequestException(error)
    }

    error.status = this.getStatusCode(error)
    return error
  }

  private toExternalRequestException(error: AxiosError<ExternalErrorResponse>): ApiExternalRequestException {
    const status = this.getStatusCode(error)

    const data = ObjectUtils.reach(error, (o) => o.response.data, {})
    const nested = ObjectUtils.reach(data, (o) => o.error, {})

    const message = ObjectUtils.firstDefined(nested.message, data.message, error.message) as string

    const exception = new ApiExternalRequestException(status, message, nested ?? data, { cause: error })
    return exception
  }

  private getStatusCode(error: ZodError | AxiosError<ExternalErrorResponse>): number {
    if (error instanceof ZodError) {
      return ApiBadRequestException.STATUS
    }

    const code = error?.code

    if (code && NETWORK_RETRY_CODES.includes(code)) {
      return ApiTimeoutException.STATUS
    }

    const data = ObjectUtils.reach(error, (o) => o.response.data, {})
    const nested = ObjectUtils.reach(data, (o) => o.error, {})

    return (
      ObjectUtils.firstDefined(nested.code, data.code, error?.response?.status, error.status) ??
      ApiInternalServerException.STATUS
    )
  }
}

type ExternalErrorResponse = {
  code?: number
  message?: string
  error?: {
    code?: number
    message?: string
  }
}
