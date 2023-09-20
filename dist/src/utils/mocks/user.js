"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersResponseMock = exports.userResponseMock = exports.userCreateMock = void 0;
const user_1 = require("../../core/user/entity/user");
const tests_1 = require("../tests");
exports.userCreateMock = {
    login: 'login',
    password: '**********',
    roles: [user_1.UserRole.USER]
};
exports.userResponseMock = Object.assign({ id: (0, tests_1.generateUUID)() }, exports.userCreateMock);
exports.usersResponseMock = Object.assign(Object.assign({}, exports.userResponseMock), { createdAt: new Date(), updatedAt: new Date() });
//# sourceMappingURL=user.js.map