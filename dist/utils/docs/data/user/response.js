"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UsersResponse", {
    enumerable: true,
    get: function() {
        return UsersResponse;
    }
});
const _user = require("../../../../core/user/entity/user");
const _tests = require("../../../tests/tests");
const entity = new _user.UserEntity({
    login: 'login',
    password: '**********',
    roles: [
        _user.UserRole.USER
    ]
});
const fullEntity = new _user.UserEntity({
    ...entity,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null
});
const UsersResponse = {
    create: {
        created: true,
        id: (0, _tests.generateUUID)()
    },
    delete: {
        ...fullEntity,
        deletedAt: new Date()
    },
    update: fullEntity,
    getByID: fullEntity,
    list: {
        docs: [
            fullEntity
        ],
        limit: 10,
        page: 1,
        total: 1
    }
};

//# sourceMappingURL=response.js.map