import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

import { ILoggerAdapter } from '@/infra/logger';
import { UUIDUtils } from '@/utils/uuid';

@Injectable()
export class HttpLoggerInterceptor implements NestInterceptor {
  constructor(private readonly logger: ILoggerAdapter) {}

  intercept(executionContext: ExecutionContext, next: CallHandler): Observable<unknown> {
    const context = `${executionContext.getClass().name}/${executionContext.getHandler().name}`;

    const request = executionContext.switchToHttp().getRequest();

    request['context'] = context;

    if (!request.headers?.traceid) {
      request.headers.traceid = UUIDUtils.create();
      request.id = request.headers.traceid;
    }

    this.logger.setGlobalParameters({ traceid: request.id });

    return next.handle();
  }
}
