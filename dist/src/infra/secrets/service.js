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
exports.SecretsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let SecretsService = class SecretsService {
    constructor(config) {
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
SecretsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SecretsService);
exports.SecretsService = SecretsService;
//# sourceMappingURL=service.js.map