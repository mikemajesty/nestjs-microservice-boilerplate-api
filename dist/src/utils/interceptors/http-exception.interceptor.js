"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExceptionInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const zod_1 = require("zod");
let ExceptionInterceptor = class ExceptionInterceptor {
    intercept(executionContext, next) {
        return next.handle().pipe((0, operators_1.catchError)((error) => {
            var _a;
            error.status = this.getStatusCode(error);
            const headers = (_a = executionContext.getArgs()[0]) === null || _a === void 0 ? void 0 : _a.headers;
            const request = executionContext.switchToHttp().getRequest();
            this.sanitizeExternalError(error);
            if (typeof error === 'object' && !error.traceid) {
                error.traceid = headers.traceid;
            }
            const context = `${executionContext.getClass().name}/${executionContext.getHandler().name}`;
            error.context = error.context = context;
            if (request === null || request === void 0 ? void 0 : request.tracing) {
                request.tracing.setTag(request.tracing.tags.ERROR, true);
                request.tracing.setTag('message', error.message);
                request.tracing.setTag('statusCode', error.status);
                request.tracing.finish();
            }
            throw error;
        }));
    }
    getStatusCode(error) {
        var _a, _b, _c;
        if (error instanceof zod_1.ZodError) {
            return 400;
        }
        return [error.status, (_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.status, (_c = (_b = error === null || error === void 0 ? void 0 : error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.code, 500].find(Boolean);
    }
    sanitizeExternalError(error) {
        var _a, _b, _c, _d;
        if (typeof (error === null || error === void 0 ? void 0 : error.response) === 'object' && (error === null || error === void 0 ? void 0 : error.isAxiosError)) {
            const status = [(_b = (_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.code, error === null || error === void 0 ? void 0 : error.status].find(Boolean);
            error.message = [(_d = (_c = error === null || error === void 0 ? void 0 : error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.message, error.message].find(Boolean);
            error['getResponse'] = () => { var _a; return (_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data; };
            error['getStatus'] = () => status;
        }
    }
};
ExceptionInterceptor = __decorate([
    (0, common_1.Injectable)()
], ExceptionInterceptor);
exports.ExceptionInterceptor = ExceptionInterceptor;
//# sourceMappingURL=http-exception.interceptor.js.map