"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatsResponse = void 0;
const cats_1 = require("../../../../core/cats/entity/cats");
const tests_1 = require("../../../tests/tests");
const entity = new cats_1.CatsEntity({
    name: 'Miau',
    breed: 'breed',
    age: 1
});
const fullEntity = new cats_1.CatsEntity(Object.assign(Object.assign({}, entity), { createdAt: new Date(), updatedAt: new Date(), deletedAt: null }));
exports.CatsResponse = {
    create: { created: true, id: (0, tests_1.generateUUID)() },
    delete: Object.assign(Object.assign({}, fullEntity), { deletedAt: new Date() }),
    update: fullEntity,
    getByID: fullEntity,
    list: { docs: [fullEntity], limit: 10, page: 1, total: 1 }
};
//# sourceMappingURL=response.js.map