"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersResponse = void 0;
const user_1 = require("../../../../core/user/entity/user");
const tests_1 = require("../../../tests/tests");
const entity = new user_1.UserEntity({
    login: 'login',
    password: '**********',
    roles: [user_1.UserRole.USER]
});
const fullEntity = new user_1.UserEntity(Object.assign(Object.assign({}, entity), { createdAt: new Date(), updatedAt: new Date(), deletedAt: null }));
exports.UsersResponse = {
    create: { created: true, id: (0, tests_1.generateUUID)() },
    delete: Object.assign(Object.assign({}, fullEntity), { deletedAt: new Date() }),
    update: fullEntity,
    getByID: fullEntity,
    list: { docs: [fullEntity], limit: 10, page: 1, total: 1 }
};
//# sourceMappingURL=response.js.map