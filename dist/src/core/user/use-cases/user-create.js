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
exports.UserCreateUsecase = exports.UserCreateSchema = void 0;
const validate_schema_decorator_1 = require("../../../utils/decorators/validate-schema.decorator");
const exception_1 = require("../../../utils/exception");
const user_1 = require("../entity/user");
exports.UserCreateSchema = user_1.UserEntitySchema.pick({
    login: true,
    password: true,
    roles: true
});
class UserCreateUsecase {
    constructor(userRepository, loggerServide) {
        this.userRepository = userRepository;
        this.loggerServide = loggerServide;
    }
    async execute(input, { tracing, user: userData }) {
        const entity = new user_1.UserEntity(input);
        const userExists = await this.userRepository.findOne({
            login: entity.login
        });
        if (userExists) {
            throw new exception_1.ApiConflictException('user exists');
        }
        const session = await this.userRepository.startSession();
        try {
            const user = await this.userRepository.create(entity, { session });
            await session.commitTransaction();
            this.loggerServide.info({ message: 'user created successfully', obj: { user } });
            tracing.logEvent('user-created', `user: ${entity.login} created by: ${userData.login}`);
            return user;
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
    }
}
__decorate([
    (0, validate_schema_decorator_1.ValidateSchema)(exports.UserCreateSchema),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UserCreateUsecase.prototype, "execute", null);
exports.UserCreateUsecase = UserCreateUsecase;
//# sourceMappingURL=user-create.js.map