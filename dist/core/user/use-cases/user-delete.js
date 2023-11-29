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
    UserDeleteSchema: function() {
        return UserDeleteSchema;
    },
    UserDeleteUsecase: function() {
        return UserDeleteUsecase;
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
const UserDeleteSchema = _user.UserEntitySchema.pick({
    id: true
});
let UserDeleteUsecase = class UserDeleteUsecase {
    async execute({ id }, { tracing, user: userData }) {
        const entity = await this.userRepository.findById(id);
        if (!entity) {
            throw new _exception.ApiNotFoundException();
        }
        const user = new _user.UserEntity(entity);
        user.setDeleted();
        await this.userRepository.updateOne({
            id: user.id
        }, user);
        user.anonymizePassword();
        tracing.logEvent('user-deleted', `user: ${entity.login} deleted by: ${userData.login}`);
        return user;
    }
    constructor(userRepository){
        this.userRepository = userRepository;
    }
};
_ts_decorate([
    (0, _validateschemadecorator.ValidateSchema)(UserDeleteSchema),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof UserDeleteInput === "undefined" ? Object : UserDeleteInput,
        typeof _request.ApiTrancingInput === "undefined" ? Object : _request.ApiTrancingInput
    ])
], UserDeleteUsecase.prototype, "execute", null);

//# sourceMappingURL=user-delete.js.map