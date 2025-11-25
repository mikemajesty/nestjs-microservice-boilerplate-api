import { HttpException, HttpStatus } from '@nestjs/common';

export class BaseException extends HttpException {
  traceid!: string;
  readonly context!: string;
  readonly statusCode: number;
  readonly code?: string;
  readonly parameters!: ParametersType;

  constructor(message: MessageType, status: HttpStatus, parameters?: ParametersType) {
    super(message, status);

    Error.captureStackTrace(this);
    Error.call(this);

    if (parameters) {
      this.parameters = parameters;
    }

    this.statusCode = super.getStatus();
  }
}

export class ApiInternalServerException extends BaseException {
  static STATUS = HttpStatus.INTERNAL_SERVER_ERROR;
  constructor(message?: MessageType, parameters?: ParametersType) {
    super(message ?? ApiInternalServerException.name, ApiInternalServerException.STATUS, parameters);
  }
}

export class ApiNotFoundException extends BaseException {
  static STATUS = HttpStatus.NOT_FOUND;
  constructor(message?: MessageType, parameters?: ParametersType) {
    super(message ?? ApiNotFoundException.name, ApiNotFoundException.STATUS, parameters);
  }
}

export class ApiConflictException extends BaseException {
  static STATUS = HttpStatus.CONFLICT;
  constructor(message?: MessageType, parameters?: ParametersType) {
    super(message ?? ApiConflictException.name, ApiConflictException.STATUS, parameters);
  }
}

export class ApiUnprocessableEntityException extends BaseException {
  static STATUS = HttpStatus.UNPROCESSABLE_ENTITY;
  constructor(message?: MessageType, parameters?: ParametersType) {
    super(message ?? ApiUnprocessableEntityException.name, ApiUnprocessableEntityException.STATUS, parameters);
  }
}

export class ApiUnauthorizedException extends BaseException {
  static STATUS = HttpStatus.UNAUTHORIZED;
  constructor(message?: MessageType, parameters?: ParametersType) {
    super(message ?? ApiUnauthorizedException.name, ApiUnauthorizedException.STATUS, parameters);
  }
}

export class ApiBadRequestException extends BaseException {
  static STATUS = HttpStatus.BAD_REQUEST;
  constructor(message?: MessageType, parameters?: ParametersType) {
    super(message ?? ApiBadRequestException.name, ApiBadRequestException.STATUS, parameters);
  }
}

export class ApiForbiddenException extends BaseException {
  static STATUS = HttpStatus.FORBIDDEN;
  constructor(message?: MessageType, parameters?: ParametersType) {
    super(message ?? ApiForbiddenException.name, ApiForbiddenException.STATUS, parameters);
  }
}

export class ApiTimeoutException extends BaseException {
  static STATUS = HttpStatus.REQUEST_TIMEOUT;
  constructor(message?: MessageType, parameters?: ParametersType) {
    super(message ?? ApiTimeoutException.name, ApiTimeoutException.STATUS, parameters);
  }
}

export type ApiErrorType = {
  error: {
    code: string | number;
    traceid: string;
    context: string;
    message: string[];
    timestamp: string;
    path: string;
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ParametersType = { [key: string]: any; context?: string };

export type MessageType = string | string[];
