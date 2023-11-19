"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseOptionsSchema = void 0;
const zod_1 = require("zod");
const DEFAULT_SCHEMA = 'public';
exports.DatabaseOptionsSchema = zod_1.z
    .object({
    schema: zod_1.z.string().trim().default(DEFAULT_SCHEMA),
    transaction: zod_1.z.any().optional().nullable()
})
    .default({
    schema: DEFAULT_SCHEMA
});
//# sourceMappingURL=sequelize.js.map