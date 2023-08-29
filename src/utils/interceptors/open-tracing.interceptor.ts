import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import opentelemetry, {
  AttributeValue,
  Context,
  SpanAttributes,
  SpanKind,
  SpanOptions,
  SpanStatus,
  TimeInput,
  Tracer
} from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { Resource } from '@opentelemetry/resources';
import { BasicTracerProvider, BatchSpanProcessor, ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { SemanticAttributes, SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import axiosBetterStacktrace from 'axios-better-stacktrace';
import { DateTime } from 'luxon';
import { name, version } from 'package.json';
import { Observable, tap } from 'rxjs';

import { ILoggerAdapter } from '@/infra/logger';

import { interceptAxiosResponseError, requestRetry } from '../axios';
import { ApiInternalServerException } from '../exception';
import { TracingType } from '../request';

@Injectable()
export class OpenTracingInterceptor implements NestInterceptor {
  private tracer: Tracer;

  constructor(private readonly logger: ILoggerAdapter) {
    // const provider = new BasicTracerProvider({
    //   resource: new Resource({
    //     [SemanticResourceAttributes.SERVICE_NAME]: name,
    //     [SemanticResourceAttributes.SERVICE_VERSION]: version,
    //     "sevice.name": "AFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"
    //   })
    // });

    // const traceExporter = new OTLPTraceExporter();

    // const exporter = new ConsoleSpanExporter();

    // provider.addSpanProcessor(new BatchSpanProcessor(traceExporter));
    // provider.addSpanProcessor(new BatchSpanProcessor(exporter));

    // registerInstrumentations({
    //   instrumentations: [new ExpressInstrumentation(), new HttpInstrumentation({
    //     requestHook: (span, request) => {
    //       span.setAttribute("custom request hook attribute", "request");
    //       span.end()
    //     },
    //   }), new NestInstrumentation()],
    // });

    // provider.register()

    this.tracer = opentelemetry.trace.getTracerProvider().getTracer(name, version);

    const span = this.tracer.startSpan('ola');

    span.addEvent('AFF', { TESTE: 'aff' });

    span.setAttribute('stop', 'EITGH');
    span.end();
  }

  intercept(executionContext: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = executionContext.switchToHttp().getRequest();
    const res = executionContext.switchToHttp().getResponse();

    const requestId = request.headers.traceid ?? request.id;

    const span = this.tracer.startSpan(`${request.headers.host}${request.path}`);

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
