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
    BaseEntity: function() {
        return BaseEntity;
    },
    withID: function() {
        return withID;
    }
});
const _uuid = require("uuid");
const withID = (entity)=>{
    entity.id = [
        entity?.id,
        entity?._id,
        (0, _uuid.v4)()
    ].find(Boolean);
    return entity;
};
const BaseEntity = (schema)=>{
    let Entity = class Entity {
        setDeleted() {
            this.deletedAt = new Date();
        }
        validate(entity) {
            Object.assign(entity, withID(entity));
            Object.assign(this, {
                id: entity['id']
            });
            return schema.parse(entity);
        }
    };
    Entity.nameof = (name)=>name;
    return Entity;
};

//# sourceMappingURL=entity.js.map