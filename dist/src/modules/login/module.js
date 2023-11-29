"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginModule = void 0;
const common_1 = require("@nestjs/common");
const user_1 = require("../../core/user/repository/user");
const user_login_1 = require("../../core/user/use-cases/user-login");
const auth_1 = require("../../libs/auth");
const module_1 = require("../user/module");
const adapter_1 = require("./adapter");
const controller_1 = require("./controller");
let LoginModule = exports.LoginModule = class LoginModule {
};
exports.LoginModule = LoginModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_1.TokenModule, module_1.UserModule],
        controllers: [controller_1.LoginController],
        providers: [
            {
                provide: adapter_1.ILoginAdapter,
                useFactory: (repository, tokenService) => {
                    return new user_login_1.LoginUsecase(repository, tokenService);
                },
                inject: [user_1.IUserRepository, auth_1.ITokenAdapter]
            }
        ]
    })
], LoginModule);
//# sourceMappingURL=module.js.map