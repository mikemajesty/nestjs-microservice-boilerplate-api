import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import opentelemetry, { Counter, Histogram, Meter } from '@opentelemetry/api';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';
import { DateTime } from 'luxon';
import { name, version } from 'package.json';
import { Observable, tap } from 'rxjs';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private metrics: Meter;
  private counter: Counter;
  private histogram: Histogram;

  constructor() {
    this.metrics = opentelemetry.metrics.getMeter(name, version);
    this.counter = this.metrics.createCounter(`api_requests`, { description: 'Request Counter', unit: 'ms' });
    this.histogram = this.metrics.createHistogram('api_histogram', { description: 'Request Time' });
  }

  intercept(executionContext: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = executionContext.switchToHttp().getRequest();
    const res = executionContext.switchToHttp().getResponse();

    const startTime = DateTime.now().setZone(process.env.TZ).toUTC().toJSDate().getTime();

    this.counter.add(1, {
      [SemanticAttributes.HTTP_URL]: request.url,
      [SemanticAttributes.HTTP_METHOD]: request.method
    });

    return next.handle().pipe(
      tap(() => {
        const endTime = DateTime.now().setZone(process.env.TZ).toUTC().toJSDate().getTime();

        const executionTime = endTime - startTime;

        this.histogram.record(executionTime, {
          [SemanticAttributes.HTTP_URL]: request.url,
          [SemanticAttributes.HTTP_METHOD]: request.method,
          [SemanticAttributes.HTTP_STATUS_CODE]: res.statusCode
        });
      })
    );
  }
}
