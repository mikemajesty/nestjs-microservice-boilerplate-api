import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

import { ILoggerAdapter } from '@/infra/logger';
import { IDGeneratorUtils } from '@/utils/id-generator';

@Injectable()
export class HttpLoggerInterceptor implements NestInterceptor {
  constructor(private readonly logger: ILoggerAdapter) {}

  intercept(executionContext: ExecutionContext, next: CallHandler): Observable<unknown> {
    const context = `${executionContext.getClass().name}/${executionContext.getHandler().name}`;

    const request = executionContext.switchToHttp().getRequest();

    request['context'] = context;

    if (!request.headers?.traceid) {
      request.headers.traceid = IDGeneratorUtils.uuid();
      request.id = request.headers.traceid;
    }

    this.logger.setGlobalParameters({ traceid: request.id });

    return next.handle();
  }
}
