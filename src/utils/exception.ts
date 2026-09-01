/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/utils/exception.md
 */
import { HttpException, HttpStatus } from '@nestjs/common'
import { z } from 'zod'

import { ErrorType } from '@/infra/logger'

import { ObjectUtil } from './object'
import { AnyType } from './types'

export class BaseException extends HttpException {
  traceid!: string
  readonly context!: string
  readonly statusCode: number
  readonly code?: string
  readonly parameters!: ParametersType

  constructor(message: MessageType, status: HttpStatus, metadata?: ParametersType) {
    super(message, status)

    const actualProto = new.target.prototype
    this.statusCode = status

    if (metadata) {
      this.parameters = ObjectUtil.clone<ParametersType>({ ...metadata, originalError: undefined })
    }

    if (metadata?.originalError) {
      const originalStack =
        metadata.originalError instanceof Error ? metadata.originalError.stack : String(metadata.originalError)

      this.stack = originalStack ?? this.stack
      this.cause = metadata.originalError
    }

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }

    Object.setPrototypeOf(this, actualProto)
    this.name = this.constructor.name
  }

  getOriginalError(): ErrorType | unknown {
    return this.cause
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
    details?: unknown[]
    name: string
    timestamp: string
    path: string
  }
}

export type ParametersType = {
  [key: string]: AnyType
  context?: string
  details?: string[] | z.core.$ZodIssue[]
  originalError?: ErrorType | unknown
}

export type MessageType = string

export const exceptionFromStatus = (input: HttpStatusExceptionInput): BaseException => {
  const ExceptionClass = HTTP_STATUS_EXCEPTION_MAP[input.status] ?? ApiInternalServerException

  const exception = new ExceptionClass(input.message, input.metadata)

  const originalError = ObjectUtil.reach(input, (i) => i.metadata.originalError)

  if (originalError) {
    exception.cause = originalError
    exception.stack = originalError instanceof Error ? originalError.stack : (String(originalError) ?? exception.stack)
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
