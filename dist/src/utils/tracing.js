"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("@opentelemetry/api");
const exporter_metrics_otlp_http_1 = require("@opentelemetry/exporter-metrics-otlp-http");
const exporter_trace_otlp_proto_1 = require("@opentelemetry/exporter-trace-otlp-proto");
const instrumentation_http_1 = require("@opentelemetry/instrumentation-http");
const instrumentation_mongodb_1 = require("@opentelemetry/instrumentation-mongodb");
const instrumentation_pg_1 = require("@opentelemetry/instrumentation-pg");
const instrumentation_redis_4_1 = require("@opentelemetry/instrumentation-redis-4");
const resources_1 = require("@opentelemetry/resources");
const sdk_metrics_1 = require("@opentelemetry/sdk-metrics");
const sdk_node_1 = require("@opentelemetry/sdk-node");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const uuid_1 = require("uuid");
const package_json_1 = require("../../package.json");
const request_1 = require("./request");
api_1.diag.setLogger(new api_1.DiagConsoleLogger(), api_1.DiagLogLevel.ERROR);
const tracerExporter = new exporter_trace_otlp_proto_1.OTLPTraceExporter();
const resource = new resources_1.Resource({
    [semantic_conventions_1.SemanticResourceAttributes.SERVICE_NAME]: package_json_1.name,
    [semantic_conventions_1.SemanticResourceAttributes.SERVICE_VERSION]: package_json_1.version
});
const metricExporter = new exporter_metrics_otlp_http_1.OTLPMetricExporter();
const metricReader = new sdk_metrics_1.PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 10000
});
const sdk = new sdk_node_1.NodeSDK({
    resource,
    traceExporter: tracerExporter,
    metricReader: metricReader,
    instrumentations: [
        new instrumentation_http_1.HttpInstrumentation({
            responseHook: (span, res) => {
                if (span['parentSpanId']) {
                    span.updateName(updateSpanName(span, res['req']));
                }
            },
            requestHook: (span, request) => {
                var _a;
                const id = [request['id'], request['traceid'], (_a = request['headers']) === null || _a === void 0 ? void 0 : _a.traceid].find(Boolean);
                if (!id) {
                    request['headers'].traceid = (0, uuid_1.v4)();
                    request['id'] = request['headers'].traceid;
                    span.setAttribute('traceid', request['id']);
                }
                span.updateName(updateSpanName(span, request));
            }
        }),
        new instrumentation_redis_4_1.RedisInstrumentation({
            requireParentSpan: true,
            responseHook: (span) => {
                const [name, method] = span['name'].split('-');
                span.updateName(`${name} => ${method}`);
            }
        }),
        new instrumentation_mongodb_1.MongoDBInstrumentation({
            enhancedDatabaseReporting: true,
            responseHook: (span) => {
                span.updateName(`mongodb => ${span['name'].split('.')[1]}`);
            }
        }),
        new instrumentation_pg_1.PgInstrumentation({
            requireParentSpan: true,
            responseHook: (span) => {
                span.updateName(`postgress => ${span['name'].split(' ')[0]}`);
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
const updateSpanName = (span, request) => {
    var _a, _b;
    if (span['parentSpanId']) {
        return `${span['name']} => ${request['protocol']}//${request['host']}${(0, request_1.getPathWithoutUUID)(request['path'])}`;
    }
    return `${span['name']} => ${[(_a = request['headers']) === null || _a === void 0 ? void 0 : _a.origin, request['host'], (_b = request['headers']) === null || _b === void 0 ? void 0 : _b.host].find(Boolean)}${(0, request_1.getPathWithoutUUID)(request['url'])}`;
};
//# sourceMappingURL=tracing.js.map