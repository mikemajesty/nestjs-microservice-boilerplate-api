/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/middlewares/metrics.interceptor.md
 */
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Counter, Histogram, Meter, metrics } from '@opentelemetry/api'
import { catchError, Observable, tap, throwError } from 'rxjs'

import { name, version } from '../../../package.json'

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private meter: Meter
  private counter: Counter
  private histogram: Histogram

  constructor() {
    this.meter = metrics.getMeter(name, version)
    this.counter = this.meter.createCounter('http_server_requests_count', {
      description: 'Total HTTP requests',
      unit: 'requests'
    })

    this.histogram = this.meter.createHistogram('http_server_requests_duration', {
      description: 'Duration of HTTP requests',
      unit: 'ms'
    })
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp()
    const request = httpContext.getRequest()
    const response = httpContext.getResponse()

    const startTime = process.hrtime.bigint()

    const recordMetrics = (statusCode: number) => {
      const duration = Number(process.hrtime.bigint() - startTime) / 1_000_000

      const labels = {
        'http.method': request.method,
        'http.url': request.url,
        'http.route': request.route?.path || 'unknown',
        'http.status_code': statusCode,
        'http.status_class': `${Math.floor(statusCode / 100)}xx`
      }

      this.counter.add(1, labels)
      this.histogram.record(duration, labels)
    }

    return next.handle().pipe(
      tap(() => {
        recordMetrics(response.statusCode)
      }),
      catchError((err) => {
        const statusCode = err?.status || err?.statusCode || 500
        recordMetrics(statusCode)
        return throwError(() => err)
      })
    )
  }
}

/**
 * A counter for the total number of HTTP requests.
 *
 * Useful PromQL queries:
 *
 * // Total request rate per second over the last 5 minutes:
 * sum(rate(http_server_requests_count_total[5m]))
 *
 * // Request rate per second by method and route:
 * sum(rate(http_server_requests_count_total[5m])) by (http_method, http_route)
 *
 * // Percentage of server errors (5xx) over the last 5 minutes:
 * sum(rate(http_server_requests_count_total{http_status_class="5xx"}[5m])) / sum(rate(http_server_requests_count_total[5m])) * 100
 */

/**
 * A histogram for the duration of HTTP requests in milliseconds.
 *
 * Useful PromQL queries:
 *
 * // 95th percentile of request duration over the last 5 minutes (in ms):
 * histogram_quantile(0.95, sum(rate(http_server_requests_duration_bucket[5m])) by (le))
 *
 * // 99th percentile of request duration for a specific route:
 * histogram_quantile(0.99, sum(rate(http_server_requests_duration_bucket{http_route="/api/v1/users"}[5m])) by (le))
 *
 * // Average request duration by route:
 * sum(rate(http_server_requests_duration_sum[5m])) by (http_route) / sum(rate(http_server_requests_duration_count[5m])) by (http_route)
 */
