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
    UserCreateSchema: function() {
        return UserCreateSchema;
    },
    UserCreateUsecase: function() {
        return UserCreateUsecase;
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
const UserCreateSchema = _user.UserEntitySchema.pick({
    login: true,
    password: true,
    roles: true
});
let UserCreateUsecase = class UserCreateUsecase {
    async execute(input, { tracing, user: userData }) {
        const entity = new _user.UserEntity(input);
        const userExists = await this.userRepository.findOne({
            login: entity.login
        });
        if (userExists) {
            throw new _exception.ApiConflictException('user exists');
        }
        const session = await this.userRepository.startSession();
        try {
            const user = await this.userRepository.create(entity, {
                session
            });
            await session.commitTransaction();
            this.loggerServide.info({
                message: 'user created successfully',
                obj: {
                    user
                }
            });
            tracing.logEvent('user-created', `user: ${entity.login} created by: ${userData.login}`);
            return user;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        }
    }
    constructor(userRepository, loggerServide){
        this.userRepository = userRepository;
        this.loggerServide = loggerServide;
    }
};
_ts_decorate([
    (0, _validateschemadecorator.ValidateSchema)(UserCreateSchema),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof UserCreateInput === "undefined" ? Object : UserCreateInput,
        typeof _request.ApiTrancingInput === "undefined" ? Object : _request.ApiTrancingInput
    ])
], UserCreateUsecase.prototype, "execute", null);

//# sourceMappingURL=user-create.js.map