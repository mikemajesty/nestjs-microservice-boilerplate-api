"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpTracingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const axios_better_stacktrace_1 = require("axios-better-stacktrace");
const jaeger_client_1 = require("jaeger-client");
const luxon_1 = require("luxon");
const opentracing_1 = require("opentracing");
const package_json_1 = require("../../../package.json");
const rxjs_1 = require("rxjs");
const logger_1 = require("../../infra/logger");
const axios_2 = require("../axios");
const exception_1 = require("../exception");
let HttpTracingInterceptor = class HttpTracingInterceptor {
    constructor(logger) {
        this.logger = logger;
        const config = {
            serviceName: package_json_1.name,
            sampler: {
                type: 'const',
                param: 1
            }
        };
        const options = this.getTracingLogger(logger);
        options.tags = {
            version: package_json_1.version,
            app: package_json_1.name
        };
        this.tracer = (0, jaeger_client_1.initTracer)(config, options);
    }
    intercept(executionContext, next) {
        var _a;
        const request = executionContext.switchToHttp().getRequest();
        const res = executionContext.switchToHttp().getResponse();
        const parent = this.tracer.extract(opentracing_1.FORMAT_HTTP_HEADERS, request.headers);
        const parentObject = parent ? { childOf: parent } : {};
        const span = this.tracer.startSpan(request.headers.host + request.path, parentObject);
        const requestId = (_a = request.headers.traceid) !== null && _a !== void 0 ? _a : request.id;
        const createJaegerInstance = () => {
            return {
                span: span,
                tracer: this.tracer,
                tracerId: requestId,
                tags: opentracing_1.Tags,
                axios: (options = {}) => {
                    const headers = {};
                    this.tracer.inject(span, opentracing_1.FORMAT_HTTP_HEADERS, headers);
                    options.headers = Object.assign(Object.assign({}, options.headers), headers);
                    if (request.headers.authorization) {
                        options.headers['authorization'] = `${request.headers.authorization}`;
                    }
                    options.headers['traceid'] = requestId;
                    const http = axios_1.default.create(options);
                    (0, axios_better_stacktrace_1.default)(http);
                    (0, axios_2.requestRetry)({ axios: http, logger: this.logger });
                    http.interceptors.response.use((response) => response, (error) => {
                        (0, axios_2.interceptAxiosResponseError)(error, this.logger);
                        return Promise.reject(error);
                    });
                    return http;
                },
                log: (event) => {
                    const timestamp = luxon_1.DateTime.fromJSDate(new Date()).setZone(process.env.TZ).toMillis();
                    span.log(event, timestamp);
                },
                setTag: (key, value) => {
                    span.setTag(key, value);
                },
                addTags: (object) => {
                    span.addTags(object);
                },
                finish: () => {
                    span.finish();
                },
                createSpan: (name, parent) => {
                    const parentObject = parent ? { childOf: parent } : { childOf: span };
                    return this.tracer.startSpan(name, parentObject);
                }
            };
        };
        request.tracing = createJaegerInstance();
        request.tracing.setTag(opentracing_1.Tags.HTTP_METHOD, request.method);
        request.tracing.setTag(opentracing_1.Tags.HTTP_URL, request.path);
        if (request.id) {
            request.tracing.setTag('traceId', requestId);
        }
        return next.handle().pipe((0, rxjs_1.tap)(() => {
            request.tracing.setTag(opentracing_1.Tags.HTTP_STATUS_CODE, res.statusCode);
            request.tracing.finish();
        }));
    }
    getTracingLogger(logger) {
        return {
            logger: {
                info: (message) => {
                    logger.log(message);
                },
                error: (message) => {
                    logger.error(new exception_1.ApiInternalServerException(message));
                }
            }
        };
    }
};
HttpTracingInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logger_1.ILoggerAdapter])
], HttpTracingInterceptor);
exports.HttpTracingInterceptor = HttpTracingInterceptor;
//# sourceMappingURL=http-tracing.interceptor.js.map