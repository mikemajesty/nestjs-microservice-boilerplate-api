"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserEntity = exports.UserEntitySchema = exports.UserRole = void 0;
const zod_1 = require("zod");
const entity_1 = require("../../../utils/entity");
const ID = zod_1.z.string().uuid();
const Login = zod_1.z.string().trim().min(1).max(200);
const Password = zod_1.z.string().trim().min(1).max(200);
const CreatedAt = zod_1.z.date().nullish();
const UpdatedAt = zod_1.z.date().nullish();
const DeletedAt = zod_1.z.date().default(null).nullish();
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "USER";
    UserRole["BACKOFFICE"] = "BACKOFFICE";
})(UserRole = exports.UserRole || (exports.UserRole = {}));
exports.UserEntitySchema = zod_1.z.object({
    id: ID,
    login: Login,
    password: Password,
    roles: zod_1.z.array(zod_1.z.nativeEnum(UserRole)),
    createdAt: CreatedAt,
    updatedAt: UpdatedAt,
    deletedAt: DeletedAt
});
class UserEntity extends (0, entity_1.BaseEntity)(exports.UserEntitySchema) {
    constructor(entity) {
        super();
        Object.assign(this, this.validate(entity));
    }
    anonymizePassword() {
        this.password = '**********';
    }
}
exports.UserEntity = UserEntity;
//# sourceMappingURL=user.js.map