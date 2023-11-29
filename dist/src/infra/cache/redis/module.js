"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCacheModule = void 0;
const common_1 = require("@nestjs/common");
const logger_1 = require("../../logger");
const secrets_1 = require("../../secrets");
const adapter_1 = require("../adapter");
const service_1 = require("./service");
let RedisCacheModule = class RedisCacheModule {
};
RedisCacheModule = __decorate([
    (0, common_1.Module)({
        imports: [logger_1.LoggerModule, secrets_1.SecretsModule],
        providers: [
            {
                provide: adapter_1.ICacheAdapter,
                useFactory: async ({ REDIS_URL }, logger) => {
                    const cacheService = new service_1.RedisService({ url: REDIS_URL }, logger);
                    await cacheService.connect();
                    return cacheService;
                },
                inject: [secrets_1.ISecretsAdapter, logger_1.ILoggerAdapter]
            }
        ],
        exports: [adapter_1.ICacheAdapter]
    })
], RedisCacheModule);
exports.RedisCacheModule = RedisCacheModule;
//# sourceMappingURL=module.js.map