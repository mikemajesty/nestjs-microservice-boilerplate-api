/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClientRequest, IncomingMessage, ServerResponse } from 'node:http';

import { diag, DiagConsoleLogger, DiagLogLevel, Span } from '@opentelemetry/api';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { MongoDBInstrumentation } from '@opentelemetry/instrumentation-mongodb';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { RedisInstrumentation } from '@opentelemetry/instrumentation-redis-4';
import { Resource } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';

import { name, version } from '../../package.json';
import { getPathWithoutUUID } from './request';
import { UUIDUtils } from './uuid';

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

const tracerExporter = new OTLPTraceExporter();

const resource = new Resource({
  'service.name': name,
  'service.version': version
});

const metricExporter = new OTLPMetricExporter();

const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
  exportIntervalMillis: 10000
});

const sdk = new NodeSDK({
  resource,
  traceExporter: tracerExporter,
  metricReader,
  instrumentations: [
    new HttpInstrumentation({
      responseHook: (span: Span | any, res: IncomingMessage | ServerResponse | any) => {
        if (span['parentSpanId']) {
          span.updateName(updateSpanName(span, res['req']));
        }
      },

      requestHook: (span: Span | any, request: ClientRequest | IncomingMessage | any) => {
        const id = [request['id'], request['traceid'], request['headers']?.traceid].find(Boolean);
        if (!id) {
          request['headers'].traceid = UUIDUtils.create();
          request['id'] = request['headers'].traceid;
          span.setAttribute('traceid', request['id']);
        }

        span.updateName(updateSpanName(span, request));
      }
    }),
    new RedisInstrumentation({
      requireParentSpan: true,

      responseHook: (span: Span | any) => {
        const [name, method] = span['name'].split('-');
        span.updateName(`${name} => ${method}`);
      }
    }),
    new MongoDBInstrumentation({
      enhancedDatabaseReporting: true,

      responseHook: (span: Span | any) => {
        span.updateName(`mongodb => ${span['name'].split('.')[1]}`);
      }
    }),
    new PgInstrumentation({
      requireParentSpan: true,
      responseHook: (span: Span | any) => {
        span.updateName(`postgres => ${span['name'].split(' ')[0]}`);
      }
    })
  ]
});

sdk.start();

process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.error('Tracing terminated'))
    .catch((error) => console.error('Error terminating tracing', error))
    .finally(() => process.exit(0));
});

const updateSpanName = (span: Span | any, request: ClientRequest | IncomingMessage | any) => {
  if (span['parentSpanId']) {
    return `${span['name']} => ${request['protocol']}//${request['host']}${getPathWithoutUUID(request['path'])}`;
  }

  return `${span['name']} => ${[request['headers']?.origin, request['host'], request['headers']?.host].find(
    Boolean
  )}${getPathWithoutUUID(request['url'])}`;
};
