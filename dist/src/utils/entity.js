"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseEntity = exports.withID = void 0;
const uuid_1 = require("uuid");
const withID = (entity) => {
    entity.id = [entity === null || entity === void 0 ? void 0 : entity.id, entity === null || entity === void 0 ? void 0 : entity._id, (0, uuid_1.v4)()].find(Boolean);
    return entity;
};
exports.withID = withID;
const BaseEntity = (schema) => {
    class Entity {
        setDeleted() {
            this.deletedAt = new Date();
        }
        validate(entity) {
            Object.assign(entity, (0, exports.withID)(entity));
            Object.assign(this, { id: entity['id'] });
            return schema.parse(entity);
        }
    }
    Entity.nameOf = (name) => name;
    return Entity;
};
exports.BaseEntity = BaseEntity;
//# sourceMappingURL=entity.js.map