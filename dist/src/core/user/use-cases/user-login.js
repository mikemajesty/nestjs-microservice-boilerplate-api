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
exports.LoginUsecase = exports.LoginSchema = void 0;
const validate_schema_decorator_1 = require("../../../utils/decorators/validate-schema.decorator");
const exception_1 = require("../../../utils/exception");
const user_1 = require("../entity/user");
exports.LoginSchema = user_1.UserEntitySchema.pick({
    login: true,
    password: true
});
class LoginUsecase {
    constructor(loginRepository, tokenService) {
        this.loginRepository = loginRepository;
        this.tokenService = tokenService;
    }
    async execute(input, { tracing }) {
        const login = await this.loginRepository.findOne({
            login: input.login,
            password: input.password
        });
        if (!login) {
            throw new exception_1.ApiNotFoundException();
        }
        tracing.logEvent('user-login', `${login.login}`);
        return this.tokenService.sign({
            login: login.login,
            password: login.password,
            roles: login.roles
        });
    }
}
__decorate([
    (0, validate_schema_decorator_1.ValidateSchema)(exports.LoginSchema),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Object)
], LoginUsecase.prototype, "execute", null);
exports.LoginUsecase = LoginUsecase;
//# sourceMappingURL=user-login.js.map