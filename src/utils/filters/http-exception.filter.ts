import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { AxiosError } from 'axios';
import { ZodError } from 'zod';

import { ILoggerAdapter } from '@/infra/logger/adapter';
import { BaseException, ErrorModel } from '@/utils/exception';

import { DateUtils } from '../date';
import errorStatus from '../static/http-status.json';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  constructor(private readonly loggerService: ILoggerAdapter) {}

  catch(exception: BaseException, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse();
    const request = context.getRequest<Request>();

    const status = this.getStatus(exception);

    exception.traceid = [exception.traceid, request['id']].find(Boolean);

    const message = this.getMessage(exception);

    this.loggerService.error(exception, message, exception.context);

    response.status(status).json({
      error: {
        code: status,
        traceid: exception.traceid,
        context: exception.context,
        message: [errorStatus[String(status)], message].find(Boolean),
        timestamp: DateUtils.getDateStringWithFormat(),
        path: request.url
      }
    } as ErrorModel);
  }

  private getMessage(exception: BaseException): string {
    if (exception instanceof ZodError) {
      return exception.issues.map((i) => `${i.path}: ${i.message}`).join(',');
    }

    if (exception instanceof AxiosError) {
      if ((exception as AxiosError).response?.data) {
        return (exception as AxiosError).message;
      }
    }

    return exception.message;
  }

  private getStatus(exception: BaseException) {
    if (exception instanceof ZodError) {
      return HttpStatus.BAD_REQUEST;
    }

    return exception instanceof HttpException
      ? exception.getStatus()
      : [exception['status'], HttpStatus.INTERNAL_SERVER_ERROR].find(Boolean);
  }
}
