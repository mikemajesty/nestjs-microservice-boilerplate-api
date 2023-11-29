"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TracingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const api_1 = __importStar(require("@opentelemetry/api"));
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const axios_1 = __importDefault(require("axios"));
const axios_better_stacktrace_1 = __importDefault(require("axios-better-stacktrace"));
const package_json_1 = require("../../../package.json");
const rxjs_1 = require("rxjs");
const logger_1 = require("../../infra/logger");
const axios_2 = require("../axios");
const request_1 = require("../request");
let TracingInterceptor = class TracingInterceptor {
    constructor(logger) {
        this.logger = logger;
        this.tracer = api_1.default.trace.getTracer(package_json_1.name, package_json_1.version);
    }
    intercept(executionContext, next) {
        var _a;
        const request = executionContext.switchToHttp().getRequest();
        const res = executionContext.switchToHttp().getResponse();
        const requestId = (_a = request.headers.traceid) !== null && _a !== void 0 ? _a : request.id;
        const controller = `${executionContext.getClass().name}.${executionContext.getHandler().name}`;
        const span = this.tracer.startSpan((0, request_1.getPathWithoutUUID)(request.path));
        const createJaegerInstance = () => {
            return {
                span: span,
                tracer: this.tracer,
                tracerId: requestId,
                attributes: semantic_conventions_1.SemanticAttributes,
                axios: (options) => {
                    request.headers.traceid = requestId;
                    const http = axios_1.default.create(Object.assign(Object.assign({}, options), { headers: { traceid: request.id, authorization: request.headers.authorization } }));
                    (0, axios_better_stacktrace_1.default)(http);
                    (0, axios_2.requestRetry)({ axios: http, logger: this.logger });
                    http.interceptors.response.use((response) => response, (error) => {
                        (0, axios_2.interceptAxiosResponseError)(error, this.logger);
                        return Promise.reject(error);
                    });
                    return http;
                },
                setStatus: (status) => {
                    span.setStatus(status);
                },
                logEvent: (key, value) => {
                    span.addEvent(key, value);
                },
                addAttribute: (key, value) => {
                    span.setAttribute(key, value);
                },
                finish: () => {
                    span.end();
                },
                createSpan: (name, parent) => {
                    return this.tracer.startSpan(name, { root: false }, parent);
                }
            };
        };
        request.tracing = createJaegerInstance();
        request.tracing.addAttribute(semantic_conventions_1.SemanticAttributes.HTTP_METHOD, request.method);
        request.tracing.addAttribute(semantic_conventions_1.SemanticAttributes.HTTP_URL, request.path);
        request.tracing.addAttribute('context', controller);
        if (requestId) {
            request.tracing.addAttribute('traceid', requestId);
        }
        return next.handle().pipe((0, rxjs_1.tap)(() => {
            request.tracing.setStatus({ code: api_1.SpanStatusCode.OK });
            request.tracing.addAttribute(semantic_conventions_1.SemanticAttributes.HTTP_STATUS_CODE, res.statusCode);
            request.tracing.finish();
        }));
    }
};
TracingInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logger_1.ILoggerAdapter])
], TracingInterceptor);
exports.TracingInterceptor = TracingInterceptor;
//# sourceMappingURL=tracing.interceptor.js.map