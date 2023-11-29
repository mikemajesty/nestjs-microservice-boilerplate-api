"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TracingInterceptor", {
    enumerable: true,
    get: function() {
        return TracingInterceptor;
    }
});
const _common = require("@nestjs/common");
const _api = /*#__PURE__*/ _interop_require_wildcard(require("@opentelemetry/api"));
const _semanticconventions = require("@opentelemetry/semantic-conventions");
const _axios = /*#__PURE__*/ _interop_require_default(require("axios"));
const _axiosbetterstacktrace = /*#__PURE__*/ _interop_require_default(require("axios-better-stacktrace"));
const _packagejson = require("package.json");
const _rxjs = require("rxjs");
const _logger = require("../../infra/logger");
const _axios1 = require("../axios");
const _request = require("../request");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let TracingInterceptor = class TracingInterceptor {
    intercept(executionContext, next) {
        const request = executionContext.switchToHttp().getRequest();
        const res = executionContext.switchToHttp().getResponse();
        const requestId = request.headers.traceid ?? request.id;
        const controller = `${executionContext.getClass().name}.${executionContext.getHandler().name}`;
        const span = this.tracer.startSpan((0, _request.getPathWithoutUUID)(request.path));
        const createJaegerInstance = ()=>{
            return {
                span: span,
                tracer: this.tracer,
                tracerId: requestId,
                attributes: _semanticconventions.SemanticAttributes,
                axios: (options)=>{
                    request.headers.traceid = requestId;
                    const http = _axios.default.create({
                        ...options,
                        headers: {
                            traceid: request.id,
                            authorization: request.headers.authorization
                        }
                    });
                    (0, _axiosbetterstacktrace.default)(http);
                    (0, _axios1.requestRetry)({
                        axios: http,
                        logger: this.logger
                    });
                    http.interceptors.response.use((response)=>response, (error)=>{
                        (0, _axios1.interceptAxiosResponseError)(error, this.logger);
                        return Promise.reject(error);
                    });
                    return http;
                },
                setStatus: (status)=>{
                    span.setStatus(status);
                },
                logEvent: (key, value)=>{
                    span.addEvent(key, value);
                },
                addAttribute: (key, value)=>{
                    span.setAttribute(key, value);
                },
                finish: ()=>{
                    span.end();
                },
                createSpan: (name, parent)=>{
                    return this.tracer.startSpan(name, {
                        root: false
                    }, parent);
                }
            };
        };
        request.tracing = createJaegerInstance();
        request.tracing.addAttribute(_semanticconventions.SemanticAttributes.HTTP_METHOD, request.method);
        request.tracing.addAttribute(_semanticconventions.SemanticAttributes.HTTP_URL, request.path);
        request.tracing.addAttribute('context', controller);
        if (requestId) {
            request.tracing.addAttribute('traceid', requestId);
        }
        return next.handle().pipe((0, _rxjs.tap)(()=>{
            request.tracing.setStatus({
                code: _api.SpanStatusCode.OK
            });
            request.tracing.addAttribute(_semanticconventions.SemanticAttributes.HTTP_STATUS_CODE, res.statusCode);
            request.tracing.finish();
        }));
    }
    constructor(logger){
        this.logger = logger;
        this.tracer = _api.default.trace.getTracer(_packagejson.name, _packagejson.version);
    }
};
TracingInterceptor = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _logger.ILoggerAdapter === "undefined" ? Object : _logger.ILoggerAdapter
    ])
], TracingInterceptor);

//# sourceMappingURL=tracing.interceptor.js.map