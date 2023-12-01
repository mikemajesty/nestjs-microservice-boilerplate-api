"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DatabaseOptionsSchema", {
    enumerable: true,
    get: function() {
        return DatabaseOptionsSchema;
    }
});
const _zod = require("zod");
//you can use a dynamic schema
const DEFAULT_SCHEMA = 'public';
const DatabaseOptionsSchema = _zod.z.object({
    schema: _zod.z.string().trim().default(DEFAULT_SCHEMA),
    transaction: _zod.z.any().optional().nullable()
}).default({
    schema: DEFAULT_SCHEMA
});

//# sourceMappingURL=sequelize.js.map