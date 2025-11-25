import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import opentelemetry, {
  Attributes,
  AttributeValue,
  Context,
  SpanStatus,
  SpanStatusCode,
  TimeInput,
  Tracer
} from '@opentelemetry/api';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import axiosBetterStacktrace from 'axios-better-stacktrace';
import { Observable, tap } from 'rxjs';

import { ILoggerAdapter } from '@/infra/logger';
import { AxiosUtils } from '@/utils/axios';
import { generalizePath, TracingType } from '@/utils/request';

import { name, version } from '../../../package.json';

@Injectable()
export class TracingInterceptor implements NestInterceptor {
  private tracer: Tracer;

  constructor(private readonly logger: ILoggerAdapter) {
    this.tracer = opentelemetry.trace.getTracer(name, version);
  }

  intercept(executionContext: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = executionContext.switchToHttp().getRequest();
    const res = executionContext.switchToHttp().getResponse();

    const requestId = request.headers.traceid ?? request.id;

    const controller = `${executionContext.getClass().name}.${executionContext.getHandler().name}`;

    const span = this.tracer.startSpan(generalizePath(request.path));

    const createTracingInstance = (): TracingType => {
      return {
        span,
        tracer: this.tracer,
        tracerId: requestId,
        axios: (options?: Omit<AxiosRequestConfig, 'headers'>): AxiosInstance => {
          request.headers.traceid = requestId;

          const http = axios.create({
            ...options,
            headers: { traceid: request.id, authorization: request.headers.authorization }
          });

          axiosBetterStacktrace(http);

          AxiosUtils.requestRetry({ axios: http, logger: this.logger });

          http.interceptors.response.use(
            (response) => response,
            (error) => {
              AxiosUtils.interceptAxiosResponseError(error);
              return Promise.reject(error);
            }
          );

          return http;
        },
        setStatus: (status: SpanStatus) => {
          span.setStatus(status);
        },
        logEvent: (key, value) => {
          span.addEvent(key, value as Attributes | TimeInput);
        },
        addAttribute: (key: string, value: AttributeValue) => {
          span.setAttribute(key, value);
        },
        finish: () => {
          span.end();
        },
        createSpan: (name, parent?: Context) => {
          return this.tracer.startSpan(name, { root: false }, parent);
        }
      };
    };

    request.tracing = createTracingInstance();

    request.tracing.addAttribute('http.method', request.method);
    request.tracing.addAttribute('http.url', request.path);
    request.tracing.addAttribute('context', controller);

    if (requestId) {
      request.tracing.addAttribute('traceid', requestId);
    }

    return next.handle().pipe(
      tap(() => {
        request.tracing.setStatus({ code: SpanStatusCode.OK });
        request.tracing.addAttribute('http.status_code', res.statusCode);
        request.tracing.finish();
      })
    );
  }
}
