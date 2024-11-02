import { ArgumentsHost, Catch, ExceptionFilter as AppExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { AxiosError } from 'axios';
import { ZodError, ZodIssue } from 'zod';

import { ILoggerAdapter } from '@/infra/logger/adapter';
import { DateUtils } from '@/utils/date';
import { BaseException, ErrorModel } from '@/utils/exception';
import { DefaultErrorMessage } from '@/utils/http-status';

@Catch()
export class ExceptionFilter implements AppExceptionFilter {
  constructor(private readonly loggerService: ILoggerAdapter) {}

  catch(exception: BaseException, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse();
    const request = context.getRequest<Request>();

    const status = this.getStatus(exception);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    exception.traceid = [exception.traceid, (request as any)['id']].find(Boolean);

    this.loggerService.error(exception, exception.message);
    const message = this.getMessage(exception, status as number);

    response.status(status).json({
      error: {
        code: status,
        traceid: exception.traceid,
        context: exception.context ?? exception?.parameters?.context,
        message,
        timestamp: DateUtils.getDateStringWithFormat(),
        path: request.url
      }
    } as ErrorModel);
  }

  private getMessage(exception: BaseException, status: string | number): string[] {
    const defaultError = DefaultErrorMessage[String(status)];
    if (defaultError) {
      return [defaultError];
    }

    if (exception instanceof ZodError) {
      return exception.issues.map((i: ZodIssue) => {
        const path = (i as { keys: string[] })?.['keys']?.join('.') || i.path.join('.') || 'key';

        const idArrayError = new RegExp(/^\d./).exec(path);
        if (idArrayError?.length) {
          return `${path.replace(/^\d./, `array position: ${Number(new RegExp(/^\d/)?.exec(path)?.[0])}, property: `)}: ${i.message.toLowerCase()}`;
        }
        return `${path}: ${i.message.toLowerCase()}`;
      });
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
