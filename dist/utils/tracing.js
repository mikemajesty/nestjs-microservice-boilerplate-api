"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _api = require("@opentelemetry/api");
const _exportermetricsotlphttp = require("@opentelemetry/exporter-metrics-otlp-http");
const _exportertraceotlpproto = require("@opentelemetry/exporter-trace-otlp-proto");
const _instrumentationhttp = require("@opentelemetry/instrumentation-http");
const _instrumentationmongodb = require("@opentelemetry/instrumentation-mongodb");
const _instrumentationpg = require("@opentelemetry/instrumentation-pg");
const _instrumentationredis4 = require("@opentelemetry/instrumentation-redis-4");
const _resources = require("@opentelemetry/resources");
const _sdkmetrics = require("@opentelemetry/sdk-metrics");
const _sdknode = require("@opentelemetry/sdk-node");
const _semanticconventions = require("@opentelemetry/semantic-conventions");
const _uuid = require("uuid");
const _packagejson = require("../../package.json");
const _request = require("./request");
_api.diag.setLogger(new _api.DiagConsoleLogger(), _api.DiagLogLevel.ERROR);
const tracerExporter = new _exportertraceotlpproto.OTLPTraceExporter();
const resource = new _resources.Resource({
    [_semanticconventions.SemanticResourceAttributes.SERVICE_NAME]: _packagejson.name,
    [_semanticconventions.SemanticResourceAttributes.SERVICE_VERSION]: _packagejson.version
});
const metricExporter = new _exportermetricsotlphttp.OTLPMetricExporter();
const metricReader = new _sdkmetrics.PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 10000
});
const sdk = new _sdknode.NodeSDK({
    resource,
    traceExporter: tracerExporter,
    metricReader: metricReader,
    instrumentations: [
        new _instrumentationhttp.HttpInstrumentation({
            responseHook: (span, res)=>{
                if (span['parentSpanId']) {
                    span.updateName(updateSpanName(span, res['req']));
                }
            },
            requestHook: (span, request)=>{
                const id = [
                    request['id'],
                    request['traceid'],
                    request['headers']?.traceid
                ].find(Boolean);
                if (!id) {
                    request['headers'].traceid = (0, _uuid.v4)();
                    request['id'] = request['headers'].traceid;
                    span.setAttribute('traceid', request['id']);
                }
                span.updateName(updateSpanName(span, request));
            }
        }),
        new _instrumentationredis4.RedisInstrumentation({
            requireParentSpan: true,
            responseHook: (span)=>{
                const [name, method] = span['name'].split('-');
                span.updateName(`${name} => ${method}`);
            }
        }),
        new _instrumentationmongodb.MongoDBInstrumentation({
            enhancedDatabaseReporting: true,
            responseHook: (span)=>{
                span.updateName(`mongodb => ${span['name'].split('.')[1]}`);
            }
        }),
        new _instrumentationpg.PgInstrumentation({
            requireParentSpan: true,
            responseHook: (span)=>{
                span.updateName(`postgress => ${span['name'].split(' ')[0]}`);
            }
        })
    ]
});
sdk.start();
process.on('SIGTERM', ()=>{
    sdk.shutdown().then(()=>console.error('Tracing terminated')).catch((error)=>console.error('Error terminating tracing', error)).finally(()=>process.exit(0));
});
const updateSpanName = (span, request)=>{
    if (span['parentSpanId']) {
        return `${span['name']} => ${request['protocol']}//${request['host']}${(0, _request.getPathWithoutUUID)(request['path'])}`;
    }
    return `${span['name']} => ${[
        request['headers']?.origin,
        request['host'],
        request['headers']?.host
    ].find(Boolean)}${(0, _request.getPathWithoutUUID)(request['url'])}`;
};

//# sourceMappingURL=tracing.js.map