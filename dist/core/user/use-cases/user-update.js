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
    UserUpdateSchema: function() {
        return UserUpdateSchema;
    },
    UserUpdateUsecase: function() {
        return UserUpdateUsecase;
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
const UserUpdateSchema = _user.UserEntitySchema.pick({
    id: true
}).merge(_user.UserEntitySchema.omit({
    id: true
}).partial());
let UserUpdateUsecase = class UserUpdateUsecase {
    async execute(input, { tracing, user: userData }) {
        const user = await this.userRepository.findById(input.id);
        if (!user) {
            throw new _exception.ApiNotFoundException();
        }
        const entity = new _user.UserEntity({
            ...user,
            ...input
        });
        const userExists = await this.userRepository.existsOnUpdate({
            login: entity.login,
            password: entity.password
        }, {
            id: entity.id
        });
        if (userExists) {
            throw new _exception.ApiConflictException('user exists');
        }
        await this.userRepository.updateOne({
            id: entity.id
        }, entity);
        this.loggerServide.info({
            message: 'user updated.',
            obj: {
                user: input
            }
        });
        const updated = await this.userRepository.findById(entity.id);
        const entityUpdated = new _user.UserEntity(updated);
        entityUpdated.anonymizePassword();
        tracing.logEvent('user-updated', `user: ${user.login} updated by: ${userData.login}`);
        return entityUpdated;
    }
    constructor(userRepository, loggerServide){
        this.userRepository = userRepository;
        this.loggerServide = loggerServide;
    }
};
_ts_decorate([
    (0, _validateschemadecorator.ValidateSchema)(UserUpdateSchema),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof UserUpdateInput === "undefined" ? Object : UserUpdateInput,
        typeof _request.ApiTrancingInput === "undefined" ? Object : _request.ApiTrancingInput
    ])
], UserUpdateUsecase.prototype, "execute", null);

//# sourceMappingURL=user-update.js.map