import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import { ILoggerAdapter } from '@/infra/logger/adapter';

@Injectable()
export class HttpLoggerInterceptor implements NestInterceptor {
  constructor(private readonly loggerService: ILoggerAdapter) {}

  intercept(executionContext: ExecutionContext, next: CallHandler): Observable<unknown> {
    const context = `${executionContext.getClass().name}/${executionContext.getHandler().name}`;

    const request = executionContext.switchToHttp().getRequest();
    const response = executionContext.switchToHttp().getResponse();

    request['context'] = context;

    if (!request.headers?.traceid) {
      request.headers.traceid = uuidv4();
      request.id = request.headers.traceid;
    }

    this.loggerService.logger(request, response);
    return next.handle();
  }
}
