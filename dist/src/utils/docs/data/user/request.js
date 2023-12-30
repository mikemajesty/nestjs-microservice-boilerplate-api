"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersRequest = void 0;
const user_1 = require("../../../../core/user/entity/user");
const tests_1 = require("../../../tests/tests");
exports.UsersRequest = {
    create: { login: 'login', password: '*****', roles: [user_1.UserRole.USER] },
    update: { id: (0, tests_1.generateUUID)(), login: 'login', password: '*****', roles: [user_1.UserRole.USER] }
};
//# sourceMappingURL=request.js.map