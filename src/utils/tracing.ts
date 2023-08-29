import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { Resource } from '@opentelemetry/resources';
import { BasicTracerProvider, BatchSpanProcessor, ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

import { name, version } from '../../package.json';

const provider = new BasicTracerProvider({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: name,
    [SemanticResourceAttributes.SERVICE_VERSION]: version,
    'sevice.name': 'AFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
  })
});

const traceExporter = new OTLPTraceExporter({ hostname: 'localhost' });

const exporter = new ConsoleSpanExporter();

provider.addSpanProcessor(new BatchSpanProcessor(traceExporter));
provider.addSpanProcessor(new BatchSpanProcessor(exporter));

registerInstrumentations({
  instrumentations: [
    new ExpressInstrumentation(),
    new HttpInstrumentation({
      requestHook: (span, request) => {
        span.setAttribute('custom_request', 'request');
      }
    }),
    new NestInstrumentation()
  ]
});

provider.register();
