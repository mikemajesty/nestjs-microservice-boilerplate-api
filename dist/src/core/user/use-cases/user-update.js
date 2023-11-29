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
exports.UserUpdateUsecase = exports.UserUpdateSchema = void 0;
const validate_schema_decorator_1 = require("../../../utils/decorators/validate-schema.decorator");
const exception_1 = require("../../../utils/exception");
const user_1 = require("../entity/user");
exports.UserUpdateSchema = user_1.UserEntitySchema.pick({
    id: true
}).merge(user_1.UserEntitySchema.omit({ id: true }).partial());
class UserUpdateUsecase {
    constructor(userRepository, loggerServide) {
        this.userRepository = userRepository;
        this.loggerServide = loggerServide;
    }
    async execute(input, { tracing, user: userData }) {
        const user = await this.userRepository.findById(input.id);
        if (!user) {
            throw new exception_1.ApiNotFoundException();
        }
        const entity = new user_1.UserEntity(Object.assign(Object.assign({}, user), input));
        const userExists = await this.userRepository.existsOnUpdate({ login: entity.login, password: entity.password }, { id: entity.id });
        if (userExists) {
            throw new exception_1.ApiConflictException('user exists');
        }
        await this.userRepository.updateOne({ id: entity.id }, entity);
        this.loggerServide.info({ message: 'user updated.', obj: { user: input } });
        const updated = await this.userRepository.findById(entity.id);
        const entityUpdated = new user_1.UserEntity(updated);
        entityUpdated.anonymizePassword();
        tracing.logEvent('user-updated', `user: ${user.login} updated by: ${userData.login}`);
        return entityUpdated;
    }
}
__decorate([
    (0, validate_schema_decorator_1.ValidateSchema)(exports.UserUpdateSchema),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UserUpdateUsecase.prototype, "execute", null);
exports.UserUpdateUsecase = UserUpdateUsecase;
//# sourceMappingURL=user-update.js.map