import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import axiosBetterStacktrace from 'axios-better-stacktrace';
import { initTracer, JaegerTracer, TracingConfig, TracingOptions } from 'jaeger-client';
import { DateTime } from 'luxon';
import { FORMAT_HTTP_HEADERS, Span, SpanOptions, Tags } from 'opentracing';
import { name, version } from 'package.json';
import { Observable, tap } from 'rxjs';

import { ILoggerAdapter } from '@/infra/logger';

import { interceptAxiosResponseError, requestRetry } from '../axios';
import { ApiInternalServerException } from '../exception';
import { TracingType } from '../request';

@Injectable()
export class HttpTracingInterceptor implements NestInterceptor {
  private tracer: JaegerTracer;

  constructor(private readonly logger: ILoggerAdapter) {
    const config: TracingConfig = {
      serviceName: name,
      sampler: {
        type: 'const',
        param: 1
      }
    };

    const options: TracingOptions = this.getTracingLogger(logger);

    options.tags = {
      version: version,
      app: name
    };

    this.tracer = initTracer(config, options);
  }

  intercept(executionContext: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = executionContext.switchToHttp().getRequest();
    const res = executionContext.switchToHttp().getResponse();

    const parent = this.tracer.extract(FORMAT_HTTP_HEADERS, request.headers);
    const parentObject = parent ? { childOf: parent } : {};
    const span = this.tracer.startSpan(request.headers.host + request.path, parentObject);

    const requestId = request.headers.traceid ?? request.id;

    const createJaegerInstance = (): TracingType => {
      return {
        span: span,
        tracer: this.tracer,
        tracerId: requestId,
        tags: Tags,
        axios: (options: AxiosRequestConfig = {}): AxiosInstance => {
          const headers = {};
          this.tracer.inject(span, FORMAT_HTTP_HEADERS, headers);
          options.headers = { ...options.headers, ...headers };

          if (request.headers.authorization) {
            options.headers['authorization'] = `${request.headers.authorization}`;
          }

          options.headers['traceid'] = requestId;

          const http = axios.create(options);
          axiosBetterStacktrace(http);
          requestRetry({ axios: http, logger: this.logger });

          interceptAxiosResponseError(http, this.logger);

          return http;
        },
        log: (event: { [key: string]: unknown }) => {
          const timestamp = DateTime.fromJSDate(new Date()).setZone(process.env.TZ).toMillis();
          span.log(event, timestamp);
        },
        setTag: (key, value) => {
          span.setTag(key, value);
        },
        addTags: (object) => {
          span.addTags(object);
        },
        finish: () => {
          span.finish();
        },
        createSpan: (name, parent: Span) => {
          const parentObject: SpanOptions = parent ? { childOf: parent } : { childOf: span };
          return this.tracer.startSpan(name, parentObject);
        }
      };
    };

    request.tracing = createJaegerInstance();

    request.tracing.setTag(Tags.HTTP_METHOD, request.method);
    request.tracing.setTag(Tags.HTTP_URL, request.path);

    if (request.id) {
      request.tracing.setTag('traceId', requestId);
    }

    return next.handle().pipe(
      tap(() => {
        request.tracing.setTag(Tags.HTTP_STATUS_CODE, res.statusCode);
        request.tracing.finish();
      })
    );
  }

  private getTracingLogger(logger: ILoggerAdapter): TracingOptions {
    return {
      logger: {
        info: (message: string) => {
          logger.log(message);
        },
        error: (message: string) => {
          logger.error(new ApiInternalServerException(message));
        }
      }
    };
  }
}
