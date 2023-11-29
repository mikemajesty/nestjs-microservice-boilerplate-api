"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CatsRequest", {
    enumerable: true,
    get: function() {
        return CatsRequest;
    }
});
const _tests = require("../../../tests/tests");
const CatsRequest = {
    create: {
        name: 'miau',
        breed: 'breed',
        age: 1
    },
    update: {
        id: (0, _tests.generateUUID)(),
        name: 'miau',
        breed: 'breed',
        age: 1
    }
};

//# sourceMappingURL=request.js.map