import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import opentelemetry, { Counter, Histogram, Meter } from '@opentelemetry/api';
import { Observable, tap } from 'rxjs';

import { DateUtils } from '@/utils/date';

import { name, version } from '../../../package.json';

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

    const startTime = DateUtils.getJSDate().getTime();

    this.counter.add(1, {
      'http.url': request.url,
      'http.method': request.method
    });

    return next.handle().pipe(
      tap(() => {
        const endTime = DateUtils.getJSDate().getTime();

        const executionTime = endTime - startTime;

        this.histogram.record(executionTime, {
          'http.url': request.url,
          'http.method': request.method,
          'http.status_code': res.statusCode
        });
      })
    );
  }
}
