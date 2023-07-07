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

type ParametersType = { [key: string]: unknown };

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

type ErrorParameters = {
  message?: string;
  parameters?: ParametersType;
};
export class ApiInternalServerException extends BaseException {
  constructor({ message = 'Internal Server Exception', parameters }: ErrorParameters) {
    super(message ?? ApiInternalServerException.name, 500, parameters);
  }
}

export class ApiNotFoundException extends BaseException {
  constructor({ message = 'Not Found Exception', parameters }: ErrorParameters) {
    super(message ?? ApiNotFoundException.name, 404, parameters);
  }
}

export class ApiConflictException extends BaseException {
  constructor({ message = 'Conflict Exception', parameters }: ErrorParameters) {
    super(message ?? ApiConflictException.name, 409, parameters);
  }
}

export class ApiUnauthorizedException extends BaseException {
  constructor({ message = 'Unauthorized Exception', parameters }: ErrorParameters) {
    super(message ?? ApiUnauthorizedException.name, 401, parameters);
  }
}

export class ApiBadRequestException extends BaseException {
  constructor({ message = 'BadRequest Exception', parameters }: ErrorParameters) {
    super(message ?? ApiBadRequestException.name, 400, parameters);
  }
}

export class ApiForbiddenException extends BaseException {
  constructor({ message = 'ForbiddenException', parameters }: ErrorParameters) {
    super(message ?? ApiBadRequestException.name, 403, parameters);
  }
}
