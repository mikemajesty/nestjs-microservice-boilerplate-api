"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatsEntity = exports.CatsEntitySchema = void 0;
const zod_1 = require("zod");
const entity_1 = require("../../../utils/entity");
const ID = zod_1.z.string().uuid();
const Name = zod_1.z.string().trim().min(1).max(200);
const Breed = zod_1.z.string().trim().min(1).max(200);
const Age = zod_1.z.number().min(0).max(30);
const CreatedAt = zod_1.z.date().nullish();
const UpdatedAt = zod_1.z.date().nullish();
const DeletedAt = zod_1.z.date().default(null).nullish();
exports.CatsEntitySchema = zod_1.z.object({
    id: ID,
    name: Name,
    breed: Breed,
    age: Age,
    createdAt: CreatedAt,
    updatedAt: UpdatedAt,
    deletedAt: DeletedAt
});
class CatsEntity extends (0, entity_1.BaseEntity)() {
    constructor(entity) {
        super();
        Object.assign(this, exports.CatsEntitySchema.parse((0, entity_1.withID)(entity)));
    }
}
exports.CatsEntity = CatsEntity;
//# sourceMappingURL=cats.js.map