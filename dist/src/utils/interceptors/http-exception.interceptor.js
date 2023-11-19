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
exports.ExceptionInterceptor = void 0;
const common_1 = require("@nestjs/common");
const api_1 = require("@opentelemetry/api");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const operators_1 = require("rxjs/operators");
const zod_1 = require("zod");
const logger_1 = require("../../infra/logger");
let ExceptionInterceptor = exports.ExceptionInterceptor = class ExceptionInterceptor {
    constructor(logger) {
        this.logger = logger;
    }
    intercept(executionContext, next) {
        return next.handle().pipe((0, operators_1.catchError)((error) => {
            var _a;
            error.status = this.getStatusCode(error);
            const headers = (_a = executionContext.getArgs()[0]) === null || _a === void 0 ? void 0 : _a.headers;
            const request = executionContext.switchToHttp().getRequest();
            const res = executionContext.switchToHttp().getResponse();
            this.logger.logger(request, res);
            this.sanitizeExternalError(error);
            if (typeof error === 'object' && !error.traceid) {
                error.traceid = headers.traceid;
            }
            const context = `${executionContext.getClass().name}/${executionContext.getHandler().name}`;
            error.context = error.context = context;
            if (request === null || request === void 0 ? void 0 : request.tracing) {
                request.tracing.addAttribute(semantic_conventions_1.SemanticAttributes.HTTP_STATUS_CODE, error.status);
                request.tracing.setStatus({ message: error.message, code: api_1.SpanStatusCode.ERROR });
                request.tracing.finish();
            }
            throw error;
        }));
    }
    getStatusCode(error) {
        var _a, _b, _c, _d, _e, _f;
        if (error instanceof zod_1.ZodError) {
            return 400;
        }
        return [
            error.status,
            (_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.status,
            (_c = (_b = error === null || error === void 0 ? void 0 : error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.code,
            (_f = (_e = (_d = error === null || error === void 0 ? void 0 : error.response) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.error) === null || _f === void 0 ? void 0 : _f.code,
            500
        ].find(Boolean);
    }
    sanitizeExternalError(error) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        if (typeof (error === null || error === void 0 ? void 0 : error.response) === 'object' && (error === null || error === void 0 ? void 0 : error.isAxiosError)) {
            const status = [(_b = (_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.code, (_e = (_d = (_c = error === null || error === void 0 ? void 0 : error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error) === null || _e === void 0 ? void 0 : _e.code, error === null || error === void 0 ? void 0 : error.status].find(Boolean);
            error.message = [(_g = (_f = error === null || error === void 0 ? void 0 : error.response) === null || _f === void 0 ? void 0 : _f.data) === null || _g === void 0 ? void 0 : _g.message, (_k = (_j = (_h = error === null || error === void 0 ? void 0 : error.response) === null || _h === void 0 ? void 0 : _h.data) === null || _j === void 0 ? void 0 : _j.error) === null || _k === void 0 ? void 0 : _k.message, error.message].find(Boolean);
            error['getResponse'] = () => { var _a, _b, _c; return [(_b = (_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error, (_c = error === null || error === void 0 ? void 0 : error.response) === null || _c === void 0 ? void 0 : _c.data].find(Boolean); };
            error['getStatus'] = () => status;
        }
    }
};
exports.ExceptionInterceptor = ExceptionInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logger_1.ILoggerAdapter])
], ExceptionInterceptor);
//# sourceMappingURL=http-exception.interceptor.js.map