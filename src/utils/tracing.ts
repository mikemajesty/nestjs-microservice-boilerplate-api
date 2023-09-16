import { ClientRequest, IncomingMessage, ServerResponse } from 'node:http';

import { diag, DiagConsoleLogger, DiagLogLevel, Span } from '@opentelemetry/api';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { MongoDBInstrumentation } from '@opentelemetry/instrumentation-mongodb';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { RedisInstrumentation } from '@opentelemetry/instrumentation-redis-4';
import { Resource } from '@opentelemetry/resources';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { v4 as uuidv4 } from 'uuid';

import { name, version } from '../../package.json';
import { getPathWithoutUUID } from './request';

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

const tracerExporter = new OTLPTraceExporter();

const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: name,
  [SemanticResourceAttributes.SERVICE_VERSION]: version
});

const meterProvider = new MeterProvider({
  resource
});

const metricExporter = new OTLPMetricExporter();

meterProvider.addMetricReader(
  new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 10000
  })
);

const meter = meterProvider.getMeter('example-exporter-collector');

const requestCounter = meter.createCounter('requests', {
  description: 'Example of a Counter'
});

requestCounter.add(1, { pid: process.pid, environment: 'staging' });

const sdk = new NodeSDK({
  resource,
  traceExporter: tracerExporter,
  instrumentations: [
    new HttpInstrumentation({
      responseHook: (span: Span, res: IncomingMessage | ServerResponse) => {
        if (span['parentSpanId']) {
          span.updateName(updateSpanName(span, res['req']));
        }
      },
      requestHook: (span: Span, request: ClientRequest | IncomingMessage) => {
        const id = [request['id'], request['traceid'], request['headers']?.traceid].find(Boolean);

        if (!id) {
          request['headers'].traceid = uuidv4();
          request['id'] = request['headers'].traceid;
          span.setAttribute('traceid', request['id']);
        }

        span.updateName(updateSpanName(span, request));
      }
    }),
    new RedisInstrumentation({
      requireParentSpan: true,
      responseHook: (span: Span) => {
        const [name, method] = span['name'].split('-');
        span.updateName(`${name} => ${method}`);
      }
    }),
    new MongoDBInstrumentation({
      enhancedDatabaseReporting: true,
      responseHook: (span: Span) => {
        span.updateName(`mongodb => ${span['name'].split('.')[1]}`);
      }
    }),
    new PgInstrumentation({
      requireParentSpan: true,
      responseHook: (span: Span) => {
        span.updateName(`postgress => ${span['name'].split(' ')[0]}`);
      }
    })
  ]
});

sdk.start();

process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});

const updateSpanName = (span: Span, request: ClientRequest | IncomingMessage) => {
  if (span['parentSpanId']) {
    return `${span['name']} => ${request['protocol']}//${request['host']}${getPathWithoutUUID(request['path'])}`;
  }

  return `${span['name']} => ${[request['headers']?.origin, request['host'], request['headers']?.host].find(
    Boolean
  )}${getPathWithoutUUID(request['url'])}`;
};
