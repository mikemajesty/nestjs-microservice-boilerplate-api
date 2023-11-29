"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatsRequest = void 0;
const tests_1 = require("../../../tests/tests");
exports.CatsRequest = {
    create: { name: 'miau', breed: 'breed', age: 1 },
    update: { id: (0, tests_1.generateUUID)(), name: 'miau', breed: 'breed', age: 1 }
};
//# sourceMappingURL=request.js.map