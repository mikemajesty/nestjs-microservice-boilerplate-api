"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UsersRequest", {
    enumerable: true,
    get: function() {
        return UsersRequest;
    }
});
const _user = require("../../../../core/user/entity/user");
const _tests = require("../../../tests/tests");
const UsersRequest = {
    create: {
        login: 'login',
        password: '*****',
        roles: [
            _user.UserRole.USER
        ]
    },
    update: {
        id: (0, _tests.generateUUID)(),
        login: 'login',
        password: '*****',
        roles: [
            _user.UserRole.USER
        ]
    }
};

//# sourceMappingURL=request.js.map