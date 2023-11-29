"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogoutModule = void 0;
const common_1 = require("@nestjs/common");
const user_logout_1 = require("../../core/user/use-cases/user-logout");
const cache_1 = require("../../infra/cache");
const redis_1 = require("../../infra/cache/redis");
const logger_1 = require("../../infra/logger");
const secrets_1 = require("../../infra/secrets");
const is_logged_middleware_1 = require("../../utils/middlewares/is-logged.middleware");
const module_1 = require("./../../libs/auth/module");
const adapter_1 = require("./adapter");
const controller_1 = require("./controller");
let LogoutModule = class LogoutModule {
    configure(consumer) {
        consumer.apply(is_logged_middleware_1.IsLoggedMiddleware).forRoutes(controller_1.LogoutController);
    }
};
LogoutModule = __decorate([
    (0, common_1.Module)({
        imports: [redis_1.RedisCacheModule, secrets_1.SecretsModule, redis_1.RedisCacheModule, module_1.TokenModule, logger_1.LoggerModule],
        controllers: [controller_1.LogoutController],
        providers: [
            {
                provide: adapter_1.ILogoutAdapter,
                useFactory: (cache, secrets) => {
                    return new user_logout_1.LogoutUsecase(cache, secrets);
                },
                inject: [cache_1.ICacheAdapter, secrets_1.ISecretsAdapter]
            }
        ],
        exports: [adapter_1.ILogoutAdapter]
    })
], LogoutModule);
exports.LogoutModule = LogoutModule;
//# sourceMappingURL=module.js.map