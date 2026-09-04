/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/utils/exception.md
 */
import { HttpException, HttpStatus } from '@nestjs/common'
import { z } from 'zod'

import { ObjectUtil } from './object'
import { AnyType } from './types'

export class BaseException extends HttpException {
  traceid!: string
  context!: string
  readonly statusCode: number
  readonly code?: string
  readonly parameters!: ParametersType

  constructor(message: MessageType, status: HttpStatus, metadata?: ParametersType) {
    super(message, status)

    const actualProto = new.target.prototype
    this.statusCode = status

    if (metadata) {
      this.parameters = ObjectUtil.clone<ParametersType>({ ...metadata, cause: undefined })
    }

    if (metadata?.context) {
      this.context = metadata.context
    }

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }

    if (metadata?.cause) {
      const originalStack = metadata.cause instanceof Error ? metadata.cause.stack : String(metadata.cause)

      this.stack = originalStack ?? this.stack
      this.cause = metadata.cause
    }

    Object.setPrototypeOf(this, actualProto)
    this.name = this.constructor.name
  }

  getCause<T>(): T {
    return this.cause as T
  }
}

export class ApiInternalServerException extends BaseException {
  static STATUS = HttpStatus.INTERNAL_SERVER_ERROR
  constructor(message?: MessageType, metadata?: ParametersType) {
    super(message ?? ApiInternalServerException.name, ApiInternalServerException.STATUS, metadata)
  }
}

export class ApiNotFoundException extends BaseException {
  static STATUS = HttpStatus.NOT_FOUND
  constructor(message?: MessageType, metadata?: ParametersType) {
    super(message ?? ApiNotFoundException.name, ApiNotFoundException.STATUS, metadata)
  }
}

export class ApiConflictException extends BaseException {
  static STATUS = HttpStatus.CONFLICT
  constructor(message?: MessageType, metadata?: ParametersType) {
    super(message ?? ApiConflictException.name, ApiConflictException.STATUS, metadata)
  }
}

export class ApiUnprocessableEntityException extends BaseException {
  static STATUS = HttpStatus.UNPROCESSABLE_ENTITY
  constructor(message?: MessageType, metadata?: ParametersType) {
    super(message ?? ApiUnprocessableEntityException.name, ApiUnprocessableEntityException.STATUS, metadata)
  }
}

export class ApiUnauthorizedException extends BaseException {
  static STATUS = HttpStatus.UNAUTHORIZED
  constructor(message?: MessageType, metadata?: ParametersType) {
    super(message ?? ApiUnauthorizedException.name, ApiUnauthorizedException.STATUS, metadata)
  }
}

export class ApiBadRequestException extends BaseException {
  static STATUS = HttpStatus.BAD_REQUEST
  constructor(message?: MessageType, metadata?: ParametersType) {
    super(message ?? ApiBadRequestException.name, ApiBadRequestException.STATUS, metadata)
  }
}

export class ApiForbiddenException extends BaseException {
  static STATUS = HttpStatus.FORBIDDEN
  constructor(message?: MessageType, metadata?: ParametersType) {
    super(message ?? ApiForbiddenException.name, ApiForbiddenException.STATUS, metadata)
  }
}

export class ApiTimeoutException extends BaseException {
  static STATUS = HttpStatus.REQUEST_TIMEOUT
  constructor(message?: MessageType, metadata?: ParametersType) {
    super(message ?? ApiTimeoutException.name, ApiTimeoutException.STATUS, metadata)
  }
}

export type ApiErrorType = {
  error: {
    code: string | number
    traceid: string
    context: string
    message: string[]
    details?: ParametersType[`details`]
    name: string
    timestamp: string
    path: string
  }
}

export type ParametersType = {
  [key: string]: AnyType
  /** Identifies where the error occurred, usually in the `ClassName.methodName` format. */
  context?: string
  /**
   * Extra detail about the error, returned to the client in the error response (unlike `cause`, which stays
   * server-side only). Useful when `message` is a short, user-friendly summary (e.g. a translated Zod message)
   * and you still want to expose the full underlying detail for debugging — for example, the complete list of
   * Zod validation issues, or additional explanatory text about what went wrong.
   */
  details?: string[] | z.core.$ZodIssue[]
  /** The original error that caused this one, preserved for root-cause debugging (see `Error.cause`). */
  cause?: Error | (unknown & { stack?: string }) | unknown
}

export type MessageType = string

export const exceptionFromStatus = (input: HttpStatusExceptionInput): BaseException => {
  const ExceptionClass = HTTP_STATUS_EXCEPTION_MAP[input.status] ?? ApiInternalServerException

  const exception = new ExceptionClass(input.message, input.metadata)

  const cause = ObjectUtil.reach(input, (i) => i.metadata.cause)

  if (cause) {
    exception.cause = cause
    if (cause instanceof Error) {
      exception.stack = cause.stack
    } else {
      exception.stack = String(cause) || exception.stack
    }
  }

  return exception
}

export type HttpStatusExceptionInput = {
  status: number
  message: MessageType
  metadata?: ParametersType
}

const HTTP_STATUS_EXCEPTION_MAP: Record<
  number,
  new (message?: MessageType, metadata?: ParametersType) => BaseException
> = {
  [ApiBadRequestException.STATUS]: ApiBadRequestException,
  [ApiUnauthorizedException.STATUS]: ApiUnauthorizedException,
  [ApiForbiddenException.STATUS]: ApiForbiddenException,
  [ApiNotFoundException.STATUS]: ApiNotFoundException,
  [ApiTimeoutException.STATUS]: ApiTimeoutException,
  [ApiConflictException.STATUS]: ApiConflictException,
  [ApiUnprocessableEntityException.STATUS]: ApiUnprocessableEntityException,
  [ApiInternalServerException.STATUS]: ApiInternalServerException
}
