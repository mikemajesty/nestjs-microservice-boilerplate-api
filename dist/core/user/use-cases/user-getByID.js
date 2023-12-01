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
    UserGetByIdSchema: function() {
        return UserGetByIdSchema;
    },
    UserGetByIdUsecase: function() {
        return UserGetByIdUsecase;
    }
});
const _validateschemadecorator = require("../../../utils/decorators/validate-schema.decorator");
const _exception = require("../../../utils/exception");
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
const UserGetByIdSchema = _user.UserEntitySchema.pick({
    id: true
});
let UserGetByIdUsecase = class UserGetByIdUsecase {
    async execute({ id }) {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new _exception.ApiNotFoundException();
        }
        const entity = new _user.UserEntity(user);
        entity.anonymizePassword();
        return entity;
    }
    constructor(userRepository){
        this.userRepository = userRepository;
    }
};
_ts_decorate([
    (0, _validateschemadecorator.ValidateSchema)(UserGetByIdSchema),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof UserGetByIDInput === "undefined" ? Object : UserGetByIDInput
    ])
], UserGetByIdUsecase.prototype, "execute", null);

//# sourceMappingURL=user-getByID.js.map