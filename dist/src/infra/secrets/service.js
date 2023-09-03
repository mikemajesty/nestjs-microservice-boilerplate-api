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
let SecretsService = class SecretsService extends config_1.ConfigService {
    constructor() {
        super();
        this.ENV = this.get('ENV');
        this.PORT = this.get('PORT');
        this.HOST = this.get('HOST');
        this.LOGER_LEVEL = this.get('LOGER_LEVEL');
        this.REDIS_URL = this.get('REDIS_URL');
        this.POSTGRES_URL = `postgresql://${this.get('POSTGRES_USER')}:${this.get('POSTGRES_PASSWORD')}@${this.get('POSTGRES_HOST')}:${this.get('POSTGRES_PORT')}/${this.get('POSTGRES_DATABASE')}`;
        this.MONGO_URL = this.get('MONGO_URL');
        this.JEAGER_URL = this.get('JEAGER_URL');
        this.TOKEN_EXPIRATION = this.get('TOKEN_EXPIRATION');
        this.JWT_SECRET_KEY = this.get('JWT_SECRET_KEY');
    }
};
SecretsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SecretsService);
exports.SecretsService = SecretsService;
//# sourceMappingURL=service.js.map