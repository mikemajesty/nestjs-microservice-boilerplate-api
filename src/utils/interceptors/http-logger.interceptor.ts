import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class HttpLoggerInterceptor implements NestInterceptor {
  intercept(executionContext: ExecutionContext, next: CallHandler): Observable<unknown> {
    const context = `${executionContext.getClass().name}/${executionContext.getHandler().name}`;

    const request = executionContext.switchToHttp().getRequest();

    request['context'] = context;

    if (!request.headers?.traceid) {
      request.headers.traceid = uuidv4();
      request.id = request.headers.traceid;
    }

    return next.handle();
  }
}
