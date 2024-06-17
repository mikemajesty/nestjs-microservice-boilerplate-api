import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { SpanStatusCode } from '@opentelemetry/api';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ZodError } from 'zod';

@Injectable()
export class ExceptionInterceptor implements NestInterceptor {
  intercept(executionContext: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      catchError((error) => {
        error.status = this.getStatusCode(error);

        const headers = executionContext.getArgs()[0]?.headers;

        const request = executionContext.switchToHttp().getRequest();

        this.sanitizeExternalError(error);

        if (typeof error === 'object' && !error.traceid) {
          error.traceid = headers.traceid;
        }

        if (!error?.context) {
          const context = `${executionContext.getClass().name}/${executionContext.getHandler().name}`;
          error.context = context;
        }

        if (request?.tracing) {
          request.tracing.addAttribute('http.status_code', error.status);
          request.tracing.setStatus({ message: error.message, code: SpanStatusCode.ERROR });
          request.tracing.finish();
        }

        throw error;
      })
    );
  }

  private getStatusCode(error): number {
    if (error instanceof ZodError) {
      return 400;
    }

    if (error?.code === 'ECONNABORTED' || error?.code === 'ECONNRESET') {
      return 408;
    }

    return [
      error.status,
      error?.response?.status,
      error?.response?.data?.code,
      error?.response?.data?.error?.code,
      500
    ].find(Boolean);
  }

  private sanitizeExternalError(error) {
    if (typeof error?.response === 'object' && error?.isAxiosError) {
      const status = [error?.response?.data?.code, error?.response?.data?.error?.code, error?.status].find(Boolean);
      error.message = [error?.response?.data?.message, error?.response?.data?.error?.message, error.message].find(
        Boolean
      );
      error['getResponse'] = () => [error?.response?.data?.error, error?.response?.data].find(Boolean);
      error['getStatus'] = () => status;
    }
  }
}
