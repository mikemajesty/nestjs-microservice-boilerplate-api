"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAdminSeed = void 0;
const user_1 = require("../../../../core/user/entity/user");
exports.UserAdminSeed = {
    id: 'b23fd7b8-b1eb-44df-b99e-297bf346e88e',
    login: 'admin',
    password: 'admin',
    roles: [user_1.UserRole.BACKOFFICE, user_1.UserRole.USER]
};
//# sourceMappingURL=create-user-admin.js.map