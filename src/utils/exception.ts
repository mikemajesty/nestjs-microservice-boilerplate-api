import { HttpException, HttpStatus } from '@nestjs/common';

export type ErrorModel = {
  error: {
    code: string | number;
    traceid: string;
    context: string;
    message: string[];
    timestamp: string;
    path: string;
  };
};

type ParametersType = { [key: string]: unknown };

type MessageType = string | string[];

export class BaseException extends HttpException {
  traceid: string;
  readonly context: string;
  readonly statusCode: number;
  readonly code?: string;
  readonly parameters: ParametersType;

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
    super(message ?? ApiInternalServerException.name, 500, parameters);
  }
}

export class ApiNotFoundException extends BaseException {
  constructor(message?: MessageType, parameters?: ParametersType) {
    super(message ?? ApiNotFoundException.name, 404, parameters);
  }
}

export class ApiConflictException extends BaseException {
  constructor(message?: MessageType, parameters?: ParametersType) {
    super(message ?? ApiConflictException.name, 409, parameters);
  }
}

export class ApiUnauthorizedException extends BaseException {
  constructor(message?: MessageType, parameters?: ParametersType) {
    super(message ?? ApiUnauthorizedException.name, 401, parameters);
  }
}

export class ApiBadRequestException extends BaseException {
  constructor(message?: MessageType, parameters?: ParametersType) {
    super(message ?? ApiBadRequestException.name, 400, parameters);
  }
}

export class ApiForbiddenException extends BaseException {
  constructor(message?: MessageType, parameters?: ParametersType) {
    super(message ?? ApiForbiddenException.name, 403, parameters);
  }
}

export class ApiTimeoutException extends BaseException {
  constructor(message?: MessageType, parameters?: ParametersType) {
    super(message ?? ApiTimeoutException.name, 408, parameters);
  }
}
