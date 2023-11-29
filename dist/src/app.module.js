"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const auth_1 = require("./libs/auth");
const module_1 = require("./infra/module");
const module_2 = require("./modules/cats/module");
const module_3 = require("./modules/health/module");
const module_4 = require("./modules/login/module");
const module_5 = require("./modules/logout/module");
const module_6 = require("./modules/user/module");
const auth_guard_interceptor_1 = require("./utils/interceptors/auth-guard.interceptor");
let AppModule = exports.AppModule = class AppModule {
};
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: auth_guard_interceptor_1.RolesGuardInterceptor
            }
        ],
        imports: [module_1.InfraModule, module_3.HealthModule, module_6.UserModule, module_4.LoginModule, module_5.LogoutModule, auth_1.TokenModule, module_2.CatsModule]
    })
], AppModule);
//# sourceMappingURL=app.module.js.map