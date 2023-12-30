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
exports.LogoutUsecase = exports.LogoutSchema = void 0;
const zod_1 = require("zod");
const validate_schema_decorator_1 = require("../../../utils/decorators/validate-schema.decorator");
exports.LogoutSchema = zod_1.z.object({ token: zod_1.z.string().trim().min(10) });
class LogoutUsecase {
    constructor(redis, secretes) {
        this.redis = redis;
        this.secretes = secretes;
    }
    async execute(input, { tracing, user }) {
        await this.redis.set(input.token, input.token, { PX: this.secretes.TOKEN_EXPIRATION });
        tracing.logEvent('user-logout', `${user.login}`);
    }
}
exports.LogoutUsecase = LogoutUsecase;
__decorate([
    (0, validate_schema_decorator_1.ValidateSchema)(exports.LogoutSchema),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Object)
], LogoutUsecase.prototype, "execute", null);
//# sourceMappingURL=user-logout.js.map