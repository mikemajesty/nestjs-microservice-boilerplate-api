"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "LoginModule", {
    enumerable: true,
    get: function() {
        return LoginModule;
    }
});
const _common = require("@nestjs/common");
const _user = require("../../core/user/repository/user");
const _userlogin = require("../../core/user/use-cases/user-login");
const _auth = require("../../libs/auth");
const _module = require("../user/module");
const _adapter = require("./adapter");
const _controller = require("./controller");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let LoginModule = class LoginModule {
};
LoginModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _auth.TokenModule,
            _module.UserModule
        ],
        controllers: [
            _controller.LoginController
        ],
        providers: [
            {
                provide: _adapter.ILoginAdapter,
                useFactory: (repository, tokenService)=>{
                    return new _userlogin.LoginUsecase(repository, tokenService);
                },
                inject: [
                    _user.IUserRepository,
                    _auth.ITokenAdapter
                ]
            }
        ]
    })
], LoginModule);

//# sourceMappingURL=module.js.map