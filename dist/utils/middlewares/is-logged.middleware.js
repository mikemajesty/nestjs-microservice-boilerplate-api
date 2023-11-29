"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "IsLoggedMiddleware", {
    enumerable: true,
    get: function() {
        return IsLoggedMiddleware;
    }
});
const _common = require("@nestjs/common");
const _uuid = require("uuid");
const _cache = require("../../infra/cache");
const _logger = require("../../infra/logger");
const _auth = require("../../libs/auth");
const _exception = require("../exception");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let IsLoggedMiddleware = class IsLoggedMiddleware {
    async use(request, response, next) {
        const tokenHeader = request.headers.authorization;
        if (!request.headers?.traceid) {
            request.headers.traceid = (0, _uuid.v4)();
        }
        if (!tokenHeader) {
            response.status(401);
            request['id'] = request.headers.traceid;
            this.loggerService.logger(request, response);
            throw new _exception.ApiUnauthorizedException('no token provided');
        }
        const token = tokenHeader.split(' ')[1];
        const expiredToken = await this.redisService.get(token);
        if (expiredToken) {
            request.id = request.headers.traceid;
            next(new _exception.ApiUnauthorizedException('you have been logged out'));
        }
        const userDecoded = await this.tokenService.verify(token).catch((error)=>{
            request.id = request.headers.traceid;
            error.status = _common.HttpStatus.UNAUTHORIZED;
            this.loggerService.logger(request, response);
            next(error);
        });
        request['user'] = userDecoded;
        next();
    }
    constructor(tokenService, loggerService, redisService){
        this.tokenService = tokenService;
        this.loggerService = loggerService;
        this.redisService = redisService;
    }
};
IsLoggedMiddleware = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _auth.ITokenAdapter === "undefined" ? Object : _auth.ITokenAdapter,
        typeof _logger.ILoggerAdapter === "undefined" ? Object : _logger.ILoggerAdapter,
        typeof _cache.ICacheAdapter === "undefined" ? Object : _cache.ICacheAdapter
    ])
], IsLoggedMiddleware);

//# sourceMappingURL=is-logged.middleware.js.map