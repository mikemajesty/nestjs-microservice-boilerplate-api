import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import opentelemetry, {
  AttributeValue,
  Context,
  SpanAttributes,
  SpanStatus,
  TimeInput,
  Tracer
} from '@opentelemetry/api';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import axiosBetterStacktrace from 'axios-better-stacktrace';
import { name, version } from 'package.json';
import { Observable, tap } from 'rxjs';

import { ILoggerAdapter } from '@/infra/logger';

import { interceptAxiosResponseError, requestRetry } from '../axios';
import { TracingType } from '../request';

@Injectable()
export class OpenTracingInterceptor implements NestInterceptor {
  private tracer: Tracer;

  constructor(private readonly logger: ILoggerAdapter) {
    this.tracer = opentelemetry.trace.getTracerProvider().getTracer(name, version);
  }

  intercept(executionContext: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = executionContext.switchToHttp().getRequest();
    const res = executionContext.switchToHttp().getResponse();

    const requestId = request.headers.traceid ?? request.id;

    const span = this.tracer.startSpan(request.path);

    const createJaegerInstance = (): TracingType => {
      return {
        span: span,
        tracer: this.tracer,
        tracerId: requestId,
        attributes: SemanticAttributes,
        axios: (options: AxiosRequestConfig = {}): AxiosInstance => {
          if (request.headers.authorization) {
            options.headers['authorization'] = `${request.headers.authorization}`;
          }

          options.headers['traceid'] = requestId;

          options.headers = { traceid: request.id, ...request.headers, ...options.headers };

          const http = axios.create(options);
          axiosBetterStacktrace(http);
          requestRetry({ axios: http, logger: this.logger });

          http.interceptors.response.use(
            (response) => response,
            (error) => {
              interceptAxiosResponseError(error, this.logger);
              return Promise.reject(error);
            }
          );

          return http;
        },
        setStatus: (status: SpanStatus) => {
          span.setStatus(status);
        },
        logEvent: (key, value) => {
          span.addEvent(key, value as SpanAttributes | TimeInput);
        },
        addAttribute: (key: string, value: AttributeValue) => {
          span.setAttribute(key, value);
        },
        finish: () => {
          span.end();
        },
        createSpan: (name, parent: Context) => {
          return this.tracer.startSpan(name, { root: false }, parent);
        }
      };
    };

    request.tracing = createJaegerInstance();

    request.tracing.addAttribute(SemanticAttributes.HTTP_METHOD, request.method);
    request.tracing.addAttribute(SemanticAttributes.HTTP_URL, request.path);

    if (requestId) {
      request.tracing.addAttribute('traceId', requestId);
    }

    return next.handle().pipe(
      tap(() => {
        request.tracing.setStatus({ message: 'OK', code: res.statusCode });
        request.tracing.finish();
      })
    );
  }
}
