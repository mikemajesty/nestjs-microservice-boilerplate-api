import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Counter, Histogram, Meter, metrics } from '@opentelemetry/api';
import { catchError, Observable, tap, throwError } from 'rxjs';

import { name, version } from '../../../package.json';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private meter: Meter;
  private counter: Counter;
  private histogram: Histogram;

  constructor() {
    this.meter = metrics.getMeter(name, version);
    this.counter = this.meter.createCounter('http_server_requests_count', {
      description: 'Total HTTP requests',
      unit: 'requests'
    });

    this.histogram = this.meter.createHistogram('http_server_requests_duration', {
      description: 'Duration of HTTP requests',
      unit: 'ms'
    });
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const response = httpContext.getResponse();

    const startTime = process.hrtime.bigint();

    const recordMetrics = (statusCode: number) => {
      const duration = Number(process.hrtime.bigint() - startTime) / 1_000_000;

      const labels = {
        'http.method': request.method,
        'http.url': request.url,
        'http.route': request.route?.path || 'unknown',
        'http.status_code': statusCode,
        'http.status_class': `${Math.floor(statusCode / 100)}xx`
      };

      this.counter.add(1, labels);
      this.histogram.record(duration, labels);
    };

    return next.handle().pipe(
      tap(() => {
        recordMetrics(response.statusCode);
      }),
      catchError((err) => {
        const statusCode = err?.status || err?.statusCode || 500;
        recordMetrics(statusCode);
        return throwError(() => err);
      })
    );
  }
}
