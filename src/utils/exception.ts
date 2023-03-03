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

export class BaseException extends HttpException {
  context: string;
  traceid: string;
  statusCode: number;
  readonly code?: string;

  constructor(error: string | object, status?: HttpStatus) {
    super(error, [status, 500].find(Boolean));
    this.statusCode = super.getStatus();
  }
}

export class ApiInternalServerException extends BaseException {
  constructor(errror: string | object) {
    super(errror, 500);
  }
}

export class ApiNotFoundException extends BaseException {
  constructor(errror: string | object) {
    super(errror, 404);
  }
}

export class ApiConflictException extends BaseException {
  constructor(errror: string | object) {
    super(errror, 409);
  }
}

export class ApiUnauthorizedException extends BaseException {
  constructor(errror: string | object) {
    super(errror, 401);
  }
}

export class ApiBadRequestException extends BaseException {
  constructor(errror: string | object) {
    super(errror, 400);
  }
}
