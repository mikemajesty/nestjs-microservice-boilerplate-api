import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { AxiosError } from 'axios';
import { ZodError } from 'zod';

import { ILoggerAdapter } from '@/infra/logger/adapter';
import { DateUtils } from '@/utils/date';
import { BaseException, ErrorModel } from '@/utils/exception';
import errorStatus from '@/utils/static/http-status.json';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  constructor(private readonly loggerService: ILoggerAdapter) {}

  catch(exception: BaseException, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse();
    const request = context.getRequest<Request>();

    const status = this.getStatus(exception);

    exception.traceid = [exception.traceid, request['id']].find(Boolean);

    const message = this.getMessage(exception, status);

    this.loggerService.error(exception, message, exception.context);

    response.status(status).json({
      error: {
        code: status,
        traceid: exception.traceid,
        context: exception.context,
        message,
        timestamp: DateUtils.getDateStringWithFormat(),
        path: request.url
      }
    } as ErrorModel);
  }

  private getMessage(exception: BaseException, status: string | number): string[] {
    const defaultError = errorStatus[String(status)];
    if (defaultError) {
      return [defaultError];
    }
    if (exception instanceof ZodError) {
      return exception.issues.map((i) => `${i.path}: ${i.message.toLowerCase()}`);
    }

    if (exception instanceof AxiosError) {
      if ((exception as AxiosError).response?.data) {
        return [(exception as AxiosError).message];
      }
    }

    return [exception.message];
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
