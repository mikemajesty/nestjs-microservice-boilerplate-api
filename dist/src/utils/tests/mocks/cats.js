"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catsResponseMock = exports.catResponseMock = exports.catCreateMock = void 0;
const tests_1 = require("../tests");
exports.catCreateMock = {
    age: 10,
    breed: 'dummy',
    name: 'dummy'
};
exports.catResponseMock = Object.assign({ id: (0, tests_1.generateUUID)() }, exports.catCreateMock);
exports.catsResponseMock = Object.assign(Object.assign({}, exports.catResponseMock), { createdAt: new Date(), updatedAt: new Date() });
//# sourceMappingURL=cats.js.map