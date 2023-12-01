"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AppExceptionFilter", {
    enumerable: true,
    get: function() {
        return AppExceptionFilter;
    }
});
const _common = require("@nestjs/common");
const _axios = require("axios");
const _zod = require("zod");
const _adapter = require("../../infra/logger/adapter");
const _date = require("../date");
const _htttpstatusjson = /*#__PURE__*/ _interop_require_default(require("../static/htttp-status.json"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
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
let AppExceptionFilter = class AppExceptionFilter {
    catch(exception, host) {
        const context = host.switchToHttp();
        const response = context.getResponse();
        const request = context.getRequest();
        const status = this.getStatus(exception);
        exception.traceid = [
            exception.traceid,
            request['id']
        ].find(Boolean);
        const message = this.getMessage(exception);
        this.loggerService.error(exception, message, exception.context);
        response.status(status).json({
            error: {
                code: status,
                traceid: exception.traceid,
                message: [
                    _htttpstatusjson.default[String(status)],
                    message
                ].find(Boolean),
                timestamp: _date.DateUtils.getDateStringWithFormat(),
                path: request.url
            }
        });
    }
    getMessage(exception) {
        if (exception instanceof _zod.ZodError) {
            return exception.issues.map((i)=>`${i.path}: ${i.message}`).join(',');
        }
        if (exception instanceof _axios.AxiosError) {
            if (exception.response?.data) {
                return exception.message;
            }
        }
        return exception.message;
    }
    getStatus(exception) {
        if (exception instanceof _zod.ZodError) {
            return _common.HttpStatus.BAD_REQUEST;
        }
        return exception instanceof _common.HttpException ? exception.getStatus() : [
            exception['status'],
            _common.HttpStatus.INTERNAL_SERVER_ERROR
        ].find(Boolean);
    }
    constructor(loggerService){
        this.loggerService = loggerService;
    }
};
AppExceptionFilter = _ts_decorate([
    (0, _common.Catch)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _adapter.ILoggerAdapter === "undefined" ? Object : _adapter.ILoggerAdapter
    ])
], AppExceptionFilter);

//# sourceMappingURL=http-exception.filter.js.map