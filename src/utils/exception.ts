import { HttpException, HttpStatus } from '@nestjs/common';

export type ErrorModel = {
  error: {
    code: string | number;
    traceid: string;
    message: string;
    timestamp: string;
    path: string;
  };
};

export type ParametersType = { [key: string]: unknown };

export class BaseException extends HttpException {
  traceid: string;
  readonly context: string;
  readonly statusCode: number;
  readonly code?: string;
  readonly parameters: ParametersType;

  constructor(message: string, status: HttpStatus, parameters?: ParametersType) {
    super(message, status);

    if (parameters) {
      this.parameters = parameters;
    }

    this.statusCode = super.getStatus();
    Error.captureStackTrace(this);
  }
}

export class ApiInternalServerException extends BaseException {
  constructor(errror: string, parameters?: ParametersType) {
    super(errror ?? ApiInternalServerException.name, 500, parameters);
  }
}

export class ApiNotFoundException extends BaseException {
  constructor(errror: string, parameters?: ParametersType) {
    super(errror ?? ApiNotFoundException.name, 404, parameters);
  }
}

export class ApiConflictException extends BaseException {
  constructor(errror: string, parameters?: ParametersType) {
    super(errror ?? ApiConflictException.name, 409, parameters);
  }
}

export class ApiUnauthorizedException extends BaseException {
  constructor(errror: string, parameters?: ParametersType) {
    super(errror ?? ApiUnauthorizedException.name, 401, parameters);
  }
}

export class ApiBadRequestException extends BaseException {
  constructor(errror: string, parameters?: ParametersType) {
    super(errror ?? ApiBadRequestException.name, 400, parameters);
  }
}
