import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ExceptionInterceptor implements NestInterceptor {
  intercept(executionContext: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      catchError((error) => {
        error.status = [error.status, error?.response?.status, 500].find(Boolean);

        const headers = executionContext.getArgs()[0]?.headers;

        this.sanitizeExternalError(error);

        if (typeof error === 'object' && !error.traceid) {
          error.traceid = headers.traceid;
        }

        const context = `${executionContext.getClass().name}/${executionContext.getHandler().name}`;

        error.context = error.context = context;
        throw error;
      })
    );
  }

  private sanitizeExternalError(error) {
    if (typeof error?.response === 'object' && error?.isAxiosError) {
      error['getResponse'] = () => ({ ...error?.response?.data?.error });
      error['getStatus'] = () => [error?.response?.data?.error?.code, error?.status].find(Boolean);
      error.message = [error?.response?.data?.error?.message, error.message].find(Boolean);
      error.traceid = error?.response?.data?.error?.traceid;
    }
  }
}
