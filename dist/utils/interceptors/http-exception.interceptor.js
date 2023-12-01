"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ExceptionInterceptor", {
    enumerable: true,
    get: function() {
        return ExceptionInterceptor;
    }
});
const _common = require("@nestjs/common");
const _api = require("@opentelemetry/api");
const _semanticconventions = require("@opentelemetry/semantic-conventions");
const _operators = require("rxjs/operators");
const _zod = require("zod");
const _logger = require("../../infra/logger");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let ExceptionInterceptor = class ExceptionInterceptor {
    intercept(executionContext, next) {
        return next.handle().pipe((0, _operators.catchError)((error)=>{
            error.status = this.getStatusCode(error);
            const headers = executionContext.getArgs()[0]?.headers;
            const request = executionContext.switchToHttp().getRequest();
            const res = executionContext.switchToHttp().getResponse();
            this.logger.logger(request, res);
            this.sanitizeExternalError(error);
            if (typeof error === 'object' && !error.traceid) {
                error.traceid = headers.traceid;
            }
            const context = `${executionContext.getClass().name}/${executionContext.getHandler().name}`;
            error.context = error.context = context;
            if (request?.tracing) {
                request.tracing.addAttribute(_semanticconventions.SemanticAttributes.HTTP_STATUS_CODE, error.status);
                request.tracing.setStatus({
                    message: error.message,
                    code: _api.SpanStatusCode.ERROR
                });
                request.tracing.finish();
            }
            throw error;
        }));
    }
    getStatusCode(error) {
        if (error instanceof _zod.ZodError) {
            return 400;
        }
        return [
            error.status,
            error?.response?.status,
            error?.response?.data?.code,
            error?.response?.data?.error?.code,
            500
        ].find(Boolean);
    }
    sanitizeExternalError(error) {
        if (typeof error?.response === 'object' && error?.isAxiosError) {
            const status = [
                error?.response?.data?.code,
                error?.response?.data?.error?.code,
                error?.status
            ].find(Boolean);
            error.message = [
                error?.response?.data?.message,
                error?.response?.data?.error?.message,
                error.message
            ].find(Boolean);
            error['getResponse'] = ()=>[
                    error?.response?.data?.error,
                    error?.response?.data
                ].find(Boolean);
            error['getStatus'] = ()=>status;
        }
    }
    constructor(logger){
        this.logger = logger;
    }
};
ExceptionInterceptor = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _logger.ILoggerAdapter === "undefined" ? Object : _logger.ILoggerAdapter
    ])
], ExceptionInterceptor);

//# sourceMappingURL=http-exception.interceptor.js.map