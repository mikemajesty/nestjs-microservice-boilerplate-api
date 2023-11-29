"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "HttpLoggerInterceptor", {
    enumerable: true,
    get: function() {
        return HttpLoggerInterceptor;
    }
});
const _common = require("@nestjs/common");
const _uuid = require("uuid");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let HttpLoggerInterceptor = class HttpLoggerInterceptor {
    intercept(executionContext, next) {
        const context = `${executionContext.getClass().name}/${executionContext.getHandler().name}`;
        const request = executionContext.switchToHttp().getRequest();
        request['context'] = context;
        if (!request.headers?.traceid) {
            request.headers.traceid = (0, _uuid.v4)();
            request.id = request.headers.traceid;
        }
        return next.handle();
    }
};
HttpLoggerInterceptor = _ts_decorate([
    (0, _common.Injectable)()
], HttpLoggerInterceptor);

//# sourceMappingURL=http-logger.interceptor.js.map