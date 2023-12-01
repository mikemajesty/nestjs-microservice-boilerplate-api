"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    CatsEntity: function() {
        return CatsEntity;
    },
    CatsEntitySchema: function() {
        return CatsEntitySchema;
    }
});
const _zod = require("zod");
const _entity = require("../../../utils/entity");
const ID = _zod.z.string().uuid();
const Name = _zod.z.string().trim().min(1).max(200);
const Breed = _zod.z.string().trim().min(1).max(200);
const Age = _zod.z.number().min(0).max(30);
const CreatedAt = _zod.z.date().nullish();
const UpdatedAt = _zod.z.date().nullish();
const DeletedAt = _zod.z.date().default(null).nullish();
const CatsEntitySchema = _zod.z.object({
    id: ID,
    name: Name,
    breed: Breed,
    age: Age,
    createdAt: CreatedAt,
    updatedAt: UpdatedAt,
    deletedAt: DeletedAt
});
let CatsEntity = class CatsEntity extends (0, _entity.BaseEntity)(CatsEntitySchema) {
    constructor(entity){
        super();
        Object.assign(this, this.validate(entity));
    }
};

//# sourceMappingURL=cats.js.map