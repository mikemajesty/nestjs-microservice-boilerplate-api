"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UserAdminSeed", {
    enumerable: true,
    get: function() {
        return UserAdminSeed;
    }
});
const _user = require("../../../../core/user/entity/user");
const UserAdminSeed = {
    id: 'b23fd7b8-b1eb-44df-b99e-297bf346e88e',
    login: 'admin',
    password: 'admin',
    roles: [
        _user.UserRole.BACKOFFICE,
        _user.UserRole.USER
    ]
};

//# sourceMappingURL=create-user-admin.js.map