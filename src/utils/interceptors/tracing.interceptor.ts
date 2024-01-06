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
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import axiosBetterStacktrace from 'axios-better-stacktrace';
import { Observable, tap } from 'rxjs';

import { ILoggerAdapter } from '@/infra/logger';

import { name, version } from '../../../package.json';
import { interceptAxiosResponseError, requestRetry } from '../axios';
import { getPathWithoutUUID, TracingType } from '../request';

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

    const span = this.tracer.startSpan(getPathWithoutUUID(request.path));

    const createJaegerInstance = (): TracingType => {
      return {
        span: span,
        tracer: this.tracer,
        tracerId: requestId,
        attributes: SemanticAttributes,
        axios: (options: Omit<AxiosRequestConfig, 'headers'>): AxiosInstance => {
          request.headers.traceid = requestId;

          const http = axios.create({
            ...options,
            headers: { traceid: request.id, authorization: request.headers.authorization }
          });

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
          span.addEvent(key, value as Attributes | TimeInput);
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
    request.tracing.addAttribute('context', controller);

    if (requestId) {
      request.tracing.addAttribute('traceid', requestId);
    }

    return next.handle().pipe(
      tap(() => {
        request.tracing.setStatus({ code: SpanStatusCode.OK });
        request.tracing.addAttribute(SemanticAttributes.HTTP_STATUS_CODE, res.statusCode);
        request.tracing.finish();
      })
    );
  }
}
