"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SecretsService", {
    enumerable: true,
    get: function() {
        return SecretsService;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let SecretsService = class SecretsService {
    constructor(config){
        this.config = config;
        this.ENV = this.config.get('ENV');
        this.PORT = this.config.get('PORT');
        this.HOST = this.config.get('HOST');
        this.LOGER_LEVEL = this.config.get('LOGER_LEVEL');
        this.REDIS_URL = this.config.get('REDIS_URL');
        this.POSTGRES_URL = `postgresql://${this.config.get('POSTGRES_USER')}:${this.config.get('POSTGRES_PASSWORD')}@${this.config.get('POSTGRES_HOST')}:${this.config.get('POSTGRES_PORT')}/${this.config.get('POSTGRES_DATABASE')}`;
        this.MONGO_URL = this.config.get('MONGO_URL');
        this.ZIPKIN_URL = this.config.get('ZIPKIN_URL');
        this.PROMETHUES_URL = this.config.get('PROMETHUES_URL');
        this.TOKEN_EXPIRATION = this.config.get('TOKEN_EXPIRATION');
        this.JWT_SECRET_KEY = this.config.get('JWT_SECRET_KEY');
        this.RATE_LIMIT_BY_USER = this.config.get('RATE_LIMIT_BY_USER');
    }
};
SecretsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], SecretsService);

//# sourceMappingURL=service.js.map