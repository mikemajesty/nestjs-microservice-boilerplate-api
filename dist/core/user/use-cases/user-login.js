"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    LoginSchema: function() {
        return LoginSchema;
    },
    LoginUsecase: function() {
        return LoginUsecase;
    }
});
const _validateschemadecorator = require("../../../utils/decorators/validate-schema.decorator");
const _exception = require("../../../utils/exception");
const _request = require("../../../utils/request");
const _user = require("../entity/user");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
const LoginSchema = _user.UserEntitySchema.pick({
    login: true,
    password: true
});
let LoginUsecase = class LoginUsecase {
    async execute(input, { tracing }) {
        const login = await this.loginRepository.findOne({
            login: input.login,
            password: input.password
        });
        if (!login) {
            throw new _exception.ApiNotFoundException();
        }
        tracing.logEvent('user-login', `${login.login}`);
        return this.tokenService.sign({
            login: login.login,
            password: login.password,
            roles: login.roles
        });
    }
    constructor(loginRepository, tokenService){
        this.loginRepository = loginRepository;
        this.tokenService = tokenService;
    }
};
_ts_decorate([
    (0, _validateschemadecorator.ValidateSchema)(LoginSchema),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof LoginInput === "undefined" ? Object : LoginInput,
        typeof _request.ApiTrancingInput === "undefined" ? Object : _request.ApiTrancingInput
    ])
], LoginUsecase.prototype, "execute", null);

//# sourceMappingURL=user-login.js.map