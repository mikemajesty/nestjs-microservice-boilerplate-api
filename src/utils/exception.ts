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
  constructor(message?: MessageType, parameters?: ParametersType) {
    super(message ?? ApiInternalServerException.name, HttpStatus.INTERNAL_SERVER_ERROR, parameters);
  }
}

export class ApiNotFoundException extends BaseException {
  constructor(message?: MessageType, parameters?: ParametersType) {
    super(message ?? ApiNotFoundException.name, HttpStatus.NOT_FOUND, parameters);
  }
}

export class ApiConflictException extends BaseException {
  constructor(message?: MessageType, parameters?: ParametersType) {
    super(message ?? ApiConflictException.name, HttpStatus.CONFLICT, parameters);
  }
}

export class ApiUnauthorizedException extends BaseException {
  constructor(message?: MessageType, parameters?: ParametersType) {
    super(message ?? ApiUnauthorizedException.name, HttpStatus.UNAUTHORIZED, parameters);
  }
}

export class ApiBadRequestException extends BaseException {
  constructor(message?: MessageType, parameters?: ParametersType) {
    super(message ?? ApiBadRequestException.name, HttpStatus.BAD_REQUEST, parameters);
  }
}

export class ApiForbiddenException extends BaseException {
  constructor(message?: MessageType, parameters?: ParametersType) {
    super(message ?? ApiForbiddenException.name, HttpStatus.FORBIDDEN, parameters);
  }
}

export class ApiTimeoutException extends BaseException {
  constructor(message?: MessageType, parameters?: ParametersType) {
    super(message ?? ApiTimeoutException.name, HttpStatus.REQUEST_TIMEOUT, parameters);
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

type ParametersType = { [key: string]: unknown; context?: string };

type MessageType = string | string[];
