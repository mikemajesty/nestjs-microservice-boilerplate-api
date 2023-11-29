"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "LogoutModule", {
    enumerable: true,
    get: function() {
        return LogoutModule;
    }
});
const _common = require("@nestjs/common");
const _userlogout = require("../../core/user/use-cases/user-logout");
const _cache = require("../../infra/cache");
const _redis = require("../../infra/cache/redis");
const _logger = require("../../infra/logger");
const _secrets = require("../../infra/secrets");
const _isloggedmiddleware = require("../../utils/middlewares/is-logged.middleware");
const _module = require("../../libs/auth/module");
const _adapter = require("./adapter");
const _controller = require("./controller");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let LogoutModule = class LogoutModule {
    configure(consumer) {
        consumer.apply(_isloggedmiddleware.IsLoggedMiddleware).forRoutes(_controller.LogoutController);
    }
};
LogoutModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _redis.RedisCacheModule,
            _secrets.SecretsModule,
            _redis.RedisCacheModule,
            _module.TokenModule,
            _logger.LoggerModule
        ],
        controllers: [
            _controller.LogoutController
        ],
        providers: [
            {
                provide: _adapter.ILogoutAdapter,
                useFactory: (cache, secrets)=>{
                    return new _userlogout.LogoutUsecase(cache, secrets);
                },
                inject: [
                    _cache.ICacheAdapter,
                    _secrets.ISecretsAdapter
                ]
            }
        ],
        exports: [
            _adapter.ILogoutAdapter
        ]
    })
], LogoutModule);

//# sourceMappingURL=module.js.map