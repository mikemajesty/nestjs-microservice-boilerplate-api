"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CatsResponse", {
    enumerable: true,
    get: function() {
        return CatsResponse;
    }
});
const _cats = require("../../../../core/cats/entity/cats");
const _tests = require("../../../tests/tests");
const entity = new _cats.CatsEntity({
    name: 'Miau',
    breed: 'breed',
    age: 1
});
const fullEntity = new _cats.CatsEntity({
    ...entity,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null
});
const CatsResponse = {
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