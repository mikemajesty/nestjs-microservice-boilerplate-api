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
    UserEntity: function() {
        return UserEntity;
    },
    UserEntitySchema: function() {
        return UserEntitySchema;
    },
    UserRole: function() {
        return UserRole;
    }
});
const _zod = require("zod");
const _entity = require("../../../utils/entity");
const ID = _zod.z.string().uuid();
const Login = _zod.z.string().trim().min(1).max(200);
const Password = _zod.z.string().trim().min(1).max(200);
const CreatedAt = _zod.z.date().nullish();
const UpdatedAt = _zod.z.date().nullish();
const DeletedAt = _zod.z.date().default(null).nullish();
var UserRole;
(function(UserRole) {
    UserRole["USER"] = "USER";
    UserRole["BACKOFFICE"] = "BACKOFFICE";
})(UserRole || (UserRole = {}));
const UserEntitySchema = _zod.z.object({
    id: ID,
    login: Login,
    password: Password,
    roles: _zod.z.array(_zod.z.nativeEnum(UserRole)),
    createdAt: CreatedAt,
    updatedAt: UpdatedAt,
    deletedAt: DeletedAt
});
let UserEntity = class UserEntity extends (0, _entity.BaseEntity)(UserEntitySchema) {
    anonymizePassword() {
        this.password = '**********';
    }
    constructor(entity){
        super();
        Object.assign(this, this.validate(entity));
    }
};

//# sourceMappingURL=user.js.map