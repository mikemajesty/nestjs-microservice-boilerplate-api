/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/middlewares/exception-handler.interceptor.md
 */
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { SpanStatusCode } from '@opentelemetry/api'
import { AxiosError } from 'axios'
import { Observable } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { ZodError } from 'zod'

import { ApiBadRequestException, ApiInternalServerException, ApiTimeoutException } from '@/utils/exception'
import { TracingType } from '@/utils/request'

@Injectable()
export class ExceptionHandlerInterceptor implements NestInterceptor {
  intercept(executionContext: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      catchError((error) => {
        error.status = this.getStatusCode(error)

        const headers = executionContext.getArgs()[0]?.headers

        const request = executionContext.switchToHttp().getRequest()

        this.sanitizeExternalError(error)

        if (typeof error === 'object' && !error.traceid) {
          error.traceid = headers.traceid
        }

        if (!error?.context) {
          const context = `${executionContext.getClass().name}/${executionContext.getHandler().name}`
          error.context = context
        }

        if (request?.tracing as TracingType) {
          ;(request.tracing as TracingType).addAttribute('http.status_code', error.status)
          ;(request.tracing as TracingType).setStatus({ message: error.message, code: SpanStatusCode.ERROR })
          ;(request.tracing as TracingType).finish()
        }

        throw error
      })
    )
  }

  private getStatusCode(error: ZodError | AxiosError<ExternalErrorResponse>): number {
    if (error instanceof ZodError) {
      return ApiBadRequestException.STATUS
    }

    if (error?.code === 'ECONNABORTED' || error?.code === 'ECONNRESET') {
      return ApiTimeoutException.STATUS
    }

    const data = error?.response?.data
    const nested = data?.error

    return nested?.code ?? data?.code ?? error?.response?.status ?? error.status ?? ApiInternalServerException.STATUS
  }

  private sanitizeExternalError(error: AxiosError<ExternalErrorResponse> & SanitizedAxiosError) {
    if (!error?.isAxiosError || typeof error?.response !== 'object') return

    const data = error.response?.data
    const nested = data?.error

    const status = data?.code ?? nested?.code ?? error.status
    const message = data?.message ?? nested?.message ?? error.message

    error.message = message as string
    error.getResponse = () => nested ?? data
    error.getStatus = () => status
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

type SanitizedAxiosError = {
  getResponse?: () => ExternalErrorResponse | ExternalErrorResponse['error']
  getStatus?: () => number | undefined
}
