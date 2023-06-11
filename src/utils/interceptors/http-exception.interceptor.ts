import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ZodError } from 'zod';

import { ApiRequest } from '@/utils/request';

@Injectable()
export class ExceptionInterceptor implements NestInterceptor {
  intercept(executionContext: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      catchError((error) => {
        error.status = this.getStatusCode(error);

        const headers = executionContext.getArgs()[0]?.headers;

        const request: ApiRequest = executionContext.switchToHttp().getRequest();

        this.sanitizeExternalError(error);

        if (typeof error === 'object' && !error.traceid) {
          error.traceid = headers.traceid;
        }

        const context = `${executionContext.getClass().name}/${executionContext.getHandler().name}`;

        error.context = error.context = context;

        if (request?.tracing) {
          request.tracing.setTag(request.tracing.tags.ERROR, true);
          request.tracing.setTag('message', error.message);
          request.tracing.setTag('statusCode', error.status);
          request.tracing.finish();
        }

        throw error;
      })
    );
  }

  private getStatusCode(error: any): number {
    if (error instanceof ZodError) {
      return 400;
    }

    return [error.status, error?.response?.status, error?.response?.data?.code, 500].find(Boolean);
  }

  private sanitizeExternalError(error) {
    if (typeof error?.response === 'object' && error?.isAxiosError) {
      const status = [error?.response?.data?.code, error?.status].find(Boolean);
      error.message = [error?.response?.data?.message, error.message].find(Boolean);
      error['getResponse'] = () => error?.response?.data;
      error['getStatus'] = () => status;
    }
  }
}
