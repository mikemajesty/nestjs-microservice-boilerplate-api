/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/middlewares/exception-handler.filter.md
 */
import { ArgumentsHost, Catch, ExceptionFilter as AppExceptionFilter, HttpException } from '@nestjs/common'
import { AxiosError } from 'axios'
import { ZodError } from 'zod'

import { ILoggerAdapter } from '@/infra/logger/adapter'
import { DateUtils } from '@/utils/date'
import { ApiBadRequestException, ApiErrorType, ApiInternalServerException, BaseException } from '@/utils/exception'
import { DefaultErrorMessage } from '@/utils/http-status'

@Catch()
export class ExceptionHandlerFilter implements AppExceptionFilter {
  constructor(private readonly loggerService: ILoggerAdapter) {}

  catch(exception: BaseException, host: ArgumentsHost): void {
    const context = host.switchToHttp()
    const response = context.getResponse()
    const request = context.getRequest()

    const status = this.getStatus(exception)

    const requestId = (request as { id: string }).id
    exception.traceid = [exception.traceid, requestId].find(Boolean) as string

    this.logError(exception)
    const message = this.getErrorMessage(exception, status)

    const errorResponse: ApiErrorType = {
      error: {
        code: status,
        traceid: exception.traceid,
        context: exception.context ?? exception?.parameters?.context,
        details: exception?.parameters?.details,
        name: exception.name || exception?.constructor?.name || Error.name,
        message,
        timestamp: DateUtils.build({ format: 'yyyy-MM-dd HH:mm:ss', type: 'iso' }),
        path: request.url
      }
    }

    response.status(status).json(errorResponse)
  }

  private logError(exception: BaseException): void {
    this.loggerService.error(exception)
  }

  private getErrorMessage(exception: BaseException, status: number): string[] {
    const defaultError = DefaultErrorMessage[String(status)]
    if (defaultError) {
      return [defaultError]
    }

    if (exception instanceof ZodError) {
      return this.formatZodErrors(exception)
    }

    if (exception instanceof AxiosError) {
      return this.formatAxiosError(exception)
    }

    return this.formatBaseException(exception)
  }

  private formatZodErrors(exception: ZodError): string[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return exception.issues.map((issue: any) => {
      const isUnrecognizedKeys = issue.code === 'unrecognized_keys'

      const path = isUnrecognizedKeys
        ? (issue as ZodUnrecognizedKeysIssue).keys?.join('.')
        : issue.path?.join('.') || 'key'

      const arrayPositionMatch = /^\d+/.exec(path)
      if (arrayPositionMatch?.[0]) {
        const position = Number(arrayPositionMatch[0])
        const property = path.replace(/^\d+\./, '')
        return `array position: ${position}, property: ${property}: ${issue.message.toLowerCase()}`
      }

      return `${path}: ${issue.message}`
    })
  }

  private formatAxiosError(exception: AxiosError): string[] {
    if (exception.response?.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const responseData = exception.response.data as any
      if (typeof responseData === 'string') {
        return [responseData]
      }
      if (responseData.message) {
        return Array.isArray(responseData.message) ? responseData.message : [responseData.message]
      }
    }

    return [exception.message || 'External API request failed']
  }

  private formatBaseException(exception: BaseException): string[] {
    const response = exception.getResponse()

    if (Array.isArray(response)) {
      return response as string[]
    }

    if (typeof response === 'object' && response !== null && 'message' in response) {
      const message = (response as { message: string | string[] }).message
      return Array.isArray(message) ? message : [message]
    }

    return [exception.message || 'An unexpected error occurred']
  }

  private getStatus(exception: BaseException): number {
    if (exception instanceof ZodError) {
      return ApiBadRequestException.STATUS
    }

    if (exception instanceof HttpException) {
      return exception.getStatus()
    }

    return exception['status'] || ApiInternalServerException.STATUS
  }
}

type ZodUnrecognizedKeysIssue = {
  code: 'unrecognized_keys'
  keys: string[]
  path: (string | number)[]
  message: string
}
