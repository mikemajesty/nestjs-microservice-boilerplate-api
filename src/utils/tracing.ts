import { ClientRequest, IncomingMessage, RequestOptions, ServerResponse } from 'node:http';

import { diag, DiagConsoleLogger, DiagLogLevel, Span } from '@opentelemetry/api';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { MongoDBInstrumentation } from '@opentelemetry/instrumentation-mongodb';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { RedisInstrumentation } from '@opentelemetry/instrumentation-redis-4';
import { detectResources, Resource } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';

import { LoggerService } from '@/infra/logger';

import { name, version } from '../../package.json';
import { ApiBadRequestException } from './exception';
import { generalizePath } from './request';
import { UUIDUtils } from './uuid';

const logger = new LoggerService();
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

const getResource = (): Resource => {
  try {
    const resource = detectResources();

    Object.assign(resource.attributes, {
      'service.name': name,
      'service.version': version ?? '0.0.0',
      'deployment.environment': process.env.NODE_ENV || 'development'
    });

    return resource;
  } catch (error) {
    logger.error(new ApiBadRequestException('Error detecting resources for tracing', { originalError: error }));
    const fallbackResource = detectResources();
    Object.assign(fallbackResource.attributes, {
      'service.name': name,
      'service.version': version ?? '0.0.0',
      'deployment.environment': process.env.NODE_ENV || 'development'
    });
    return fallbackResource;
  }
};

const resource = getResource();

const tracerExporter = new OTLPTraceExporter({
  timeoutMillis: 30000
});

const metricExporter = new OTLPMetricExporter({
  timeoutMillis: 30000
});

const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
  exportIntervalMillis: 30000,
  exportTimeoutMillis: 25000
});

const isSpan = (span: Span): span is Span => {
  return span && typeof span.updateName === 'function';
};

const updateSpanName = (span: Span, request: IncomingMessage | ClientRequest): string => {
  const spanContext = span.spanContext();
  const baseName = `${spanContext.spanId}`;

  const headers = getHeaders(request);

  if (request instanceof ClientRequest) {
    const protocol = request.protocol || 'http';
    const host = request.host || headers?.host || 'unknown-host';
    const path = generalizePath(request.path || '/') || '/';
    return `${baseName} => ${protocol}//${host}${path}`;
  }

  if (request instanceof IncomingMessage) {
    const host = [headers?.origin, headers?.host].find(Boolean) || 'unknown-host';

    const urlPath = request.url?.split('?')[0] || '/';
    const path = generalizePath(urlPath) || '/';
    return buildSpanName(host as string, path);
  }

  // Fallback para tipos desconhecidos
  const host = headers?.host || 'unknown-host';
  const path = generalizePath((request as { url?: string })?.url?.split('?')[0] || '/') || '/';
  return `${'API'} => ${process.env.NODE_ENV === 'local' ? 'http' : 'https'}://${host}${path}`;
};

// Configuração mais detalhada das instrumentações
const httpInstrumentation = new HttpInstrumentation({
  ignoreIncomingRequestHook: (request: IncomingMessage) => {
    const path = request.url;
    return ['/health', '/favicon.ico', '/api-docs'].some((ignorePath) => path?.startsWith(ignorePath));
  },
  ignoreOutgoingRequestHook: (request: RequestOptions) => {
    const path = request.path;
    return ['/favicon.ico', '/v1/metrics', '/v1/traces'].some((ignorePath) => path?.startsWith(ignorePath));
  },
  responseHook: (span: Span, response: IncomingMessage | ServerResponse) => {
    if (!isSpan(span)) return;

    try {
      const req = (response as ServerResponse)?.req || (response as unknown as { request: unknown })?.['request'];
      if (req) {
        span.updateName(updateSpanName(span, req));
      }

      const statusCode = response.statusCode || (response as ServerResponse).statusCode;
      if (statusCode) {
        span.setAttribute('http.status_code', statusCode);
      }
    } catch (error) {
      logger.warn({ message: 'Error in HTTP response hook:', obj: { originalError: error } });
    }
  },
  requestHook: (span: Span, request: ClientRequest | IncomingMessage) => {
    if (!isSpan(span)) return;

    try {
      const existingTraceId = getTraceId(request);

      if (!existingTraceId) {
        setTraceId(request);
      } else {
        span.setAttribute('traceid', existingTraceId);
      }

      span.updateName(updateSpanName(span, request));

      const method = request.method;
      if (method) {
        span.setAttribute('http.method', method);
      }

      const url = (request as IncomingMessage)?.url || (request as ClientRequest)?.path;
      if (url) {
        span.setAttribute('http.url', url);
      }
    } catch (error) {
      logger.warn({ message: 'Error in HTTP request hook:', obj: { originalError: error } });
    }
  }
});

const redisInstrumentation = new RedisInstrumentation({
  requireParentSpan: false,
  responseHook: (span: Span) => {
    if (!isSpan(span)) return;

    try {
      const spanContext = span.spanContext();
      span.updateName(`redis => command-${spanContext.spanId}`);
    } catch (error) {
      logger.warn({ message: 'Error in Redis response hook:', obj: { originalError: error } });
    }
  }
});

const mongodbInstrumentation = new MongoDBInstrumentation({
  enhancedDatabaseReporting: true,
  requireParentSpan: false,
  responseHook: (span: Span) => {
    if (!isSpan(span)) return;

    try {
      // Para MongoDB, nome genérico
      const spanContext = span.spanContext();
      span.updateName(`mongodb => operation-${spanContext.spanId}`);
    } catch (error) {
      logger.warn({ message: 'Error in MongoDB response hook:', obj: { originalError: error } });
    }
  }
});

const pgInstrumentation = new PgInstrumentation({
  requireParentSpan: false,
  responseHook: (span: Span) => {
    if (!isSpan(span)) return;

    try {
      const spanContext = span.spanContext();
      span.updateName(`postgres => query-${spanContext.spanId}`);
    } catch (error) {
      logger.warn({ message: 'Error in PostgreSQL response hook:', obj: { originalError: error } });
    }
  }
});

// Configuração do SDK
const sdk = new NodeSDK({
  resource,
  traceExporter: tracerExporter,
  metricReader,
  instrumentations: [httpInstrumentation, redisInstrumentation, mongodbInstrumentation, pgInstrumentation],
  serviceName: name
});

let isInitialized = false;

const start = (): void => {
  if (isInitialized) {
    logger.warn({ message: 'Tracing already started' });
    return;
  }

  try {
    sdk.start();
    isInitialized = true;
    logger.log('✅ Tracing started successfully');
  } catch (error) {
    logger.error(new ApiBadRequestException('Tracing start error', { originalError: error }));
  }
};

const shutdown = async (): Promise<void> => {
  if (!isInitialized) {
    logger.warn({ message: 'Tracing not initialized, skipping shutdown' });
    return;
  }

  try {
    await sdk.shutdown();
    isInitialized = false;
    logger.log('✅ Tracing terminated gracefully');
  } catch (error) {
    logger.error(new ApiBadRequestException('Tracing shutdown error', { originalError: error }));
    throw error;
  }
};

// Inicialização
start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.log('Received SIGTERM, shutting down tracing...');
  await shutdown().finally(() => process.exit(0));
});

process.on('SIGINT', async () => {
  logger.log('Received SIGINT, shutting down tracing...');
  await shutdown().finally(() => process.exit(0));
});

// Export para uso em outros módulos
export const Tracing = {
  start,
  shutdown,
  isInitialized: () => isInitialized
};

const getHeaders = (request: IncomingMessage | ClientRequest): Record<string, string | string[] | undefined> => {
  if ('getHeader' in request) {
    return (request as ClientRequest).getHeaders() as Record<string, string | string[] | undefined>;
  }
  return (request as IncomingMessage).headers;
};

const getTraceId = (request: IncomingMessage | ClientRequest) => {
  if ('getHeader' in request) {
    return request.getHeader('traceid') as string;
  }
  return (request as IncomingMessage).headers?.['traceid'] as string;
};

const setTraceId = (request: IncomingMessage | ClientRequest) => {
  const newTraceId = UUIDUtils.create();
  if ('setHeader' in request) {
    (request as ClientRequest).setHeader('traceid', newTraceId);
  }
  (request as IncomingMessage).headers = {
    ...(request as IncomingMessage).headers,
    traceid: newTraceId
  };
};

const buildSpanName = (host: string, path: string): string => {
  if (['http:', 'https:'].includes(host as string)) {
    return `${'API'} => ${host}${path}`;
  }

  return `${'API'} => ${process.env.NODE_ENV === 'local' ? 'http' : 'https'}://${host}${path}`;
};
