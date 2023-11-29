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
exports.UserDeleteUsecase = exports.UserDeleteSchema = void 0;
const validate_schema_decorator_1 = require("../../../utils/decorators/validate-schema.decorator");
const exception_1 = require("../../../utils/exception");
const user_1 = require("../entity/user");
exports.UserDeleteSchema = user_1.UserEntitySchema.pick({
    id: true
});
class UserDeleteUsecase {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute({ id }, { tracing, user: userData }) {
        const entity = await this.userRepository.findById(id);
        if (!entity) {
            throw new exception_1.ApiNotFoundException();
        }
        const user = new user_1.UserEntity(entity);
        user.setDeleted();
        await this.userRepository.updateOne({ id: user.id }, user);
        user.anonymizePassword();
        tracing.logEvent('user-deleted', `user: ${entity.login} deleted by: ${userData.login}`);
        return user;
    }
}
__decorate([
    (0, validate_schema_decorator_1.ValidateSchema)(exports.UserDeleteSchema),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UserDeleteUsecase.prototype, "execute", null);
exports.UserDeleteUsecase = UserDeleteUsecase;
//# sourceMappingURL=user-delete.js.map