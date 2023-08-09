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
exports.AppExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const luxon_1 = require("luxon");
const zod_1 = require("zod");
const adapter_1 = require("../../infra/logger/adapter");
const errorStatus = require("../static/htttp-status.json");
let AppExceptionFilter = class AppExceptionFilter {
    constructor(loggerService) {
        this.loggerService = loggerService;
    }
    catch(exception, host) {
        const context = host.switchToHttp();
        const response = context.getResponse();
        const request = context.getRequest();
        const status = this.getStatus(exception);
        exception.traceid = [exception.traceid, request['id']].find(Boolean);
        const message = this.getMessage(exception);
        this.loggerService.error(exception, message, exception.context);
        response.status(status).json({
            error: {
                code: status,
                traceid: exception.traceid,
                message: [errorStatus[String(status)], message].find(Boolean),
                timestamp: luxon_1.DateTime.fromJSDate(new Date()).setZone(process.env.TZ).toFormat(process.env.DATE_FORMAT),
                path: request.url
            }
        });
    }
    getMessage(exception) {
        var _a;
        if (exception instanceof zod_1.ZodError) {
            return exception.issues.map((i) => `${i.path}: ${i.message}`).join(',');
        }
        if (exception instanceof axios_1.AxiosError) {
            if ((_a = exception.response) === null || _a === void 0 ? void 0 : _a.data) {
                return exception.message;
            }
        }
        return exception.message;
    }
    getStatus(exception) {
        if (exception instanceof zod_1.ZodError) {
            return common_1.HttpStatus.BAD_REQUEST;
        }
        return exception instanceof common_1.HttpException
            ? exception.getStatus()
            : [exception['status'], common_1.HttpStatus.INTERNAL_SERVER_ERROR].find(Boolean);
    }
};
AppExceptionFilter = __decorate([
    (0, common_1.Catch)(),
    __metadata("design:paramtypes", [adapter_1.ILoggerAdapter])
], AppExceptionFilter);
exports.AppExceptionFilter = AppExceptionFilter;
//# sourceMappingURL=http-exception.filter.js.map