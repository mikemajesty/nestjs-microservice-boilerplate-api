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
exports.IsLoggedMiddleware = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const cache_1 = require("../../infra/cache");
const logger_1 = require("../../infra/logger");
const auth_1 = require("../../libs/auth");
const exception_1 = require("../exception");
let IsLoggedMiddleware = class IsLoggedMiddleware {
    constructor(tokenService, loggerService, redisService) {
        this.tokenService = tokenService;
        this.loggerService = loggerService;
        this.redisService = redisService;
    }
    async use(request, response, next) {
        var _a;
        const tokenHeader = request.headers.authorization;
        if (!((_a = request.headers) === null || _a === void 0 ? void 0 : _a.traceid)) {
            request.headers.traceid = (0, uuid_1.v4)();
        }
        if (!tokenHeader) {
            response.status(401);
            request['id'] = request.headers.traceid;
            this.loggerService.logger(request, response);
            throw new exception_1.ApiUnauthorizedException('no token provided');
        }
        const token = tokenHeader.split(' ')[1];
        const expiredToken = await this.redisService.get(token);
        if (expiredToken) {
            request.id = request.headers.traceid;
            next(new exception_1.ApiUnauthorizedException('you have been logged out'));
        }
        const userDecoded = await this.tokenService.verify(token).catch((error) => {
            request.id = request.headers.traceid;
            error.status = common_1.HttpStatus.UNAUTHORIZED;
            this.loggerService.logger(request, response);
            next(error);
        });
        request['user'] = userDecoded;
        next();
    }
};
IsLoggedMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_1.ITokenAdapter,
        logger_1.ILoggerAdapter,
        cache_1.ICacheAdapter])
], IsLoggedMiddleware);
exports.IsLoggedMiddleware = IsLoggedMiddleware;
//# sourceMappingURL=is-logged.middleware.js.map