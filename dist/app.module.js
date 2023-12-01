"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AppModule", {
    enumerable: true,
    get: function() {
        return AppModule;
    }
});
const _common = require("@nestjs/common");
const _core = require("@nestjs/core");
const _auth = require("./libs/auth");
const _module = require("./infra/module");
const _module1 = require("./modules/cats/module");
const _module2 = require("./modules/health/module");
const _module3 = require("./modules/login/module");
const _module4 = require("./modules/logout/module");
const _module5 = require("./modules/user/module");
const _authguardinterceptor = require("./utils/interceptors/auth-guard.interceptor");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let AppModule = class AppModule {
};
AppModule = _ts_decorate([
    (0, _common.Module)({
        providers: [
            {
                provide: _core.APP_GUARD,
                useClass: _authguardinterceptor.RolesGuardInterceptor
            }
        ],
        imports: [
            _module.InfraModule,
            _module2.HealthModule,
            _module5.UserModule,
            _module3.LoginModule,
            _module4.LogoutModule,
            _auth.TokenModule,
            _module1.CatsModule
        ]
    })
], AppModule);

//# sourceMappingURL=app.module.js.map