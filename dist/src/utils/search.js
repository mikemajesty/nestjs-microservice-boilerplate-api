"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchSchema = exports.SearchHttpSchema = void 0;
const zod_1 = require("zod");
exports.SearchHttpSchema = zod_1.z
    .string()
    .optional()
    .refine((check) => {
    if (!check)
        return true;
    return [!check.startsWith(':'), check.includes(':')].every(Boolean);
}, {
    message: 'invalidSearchFormat'
})
    .refine((search) => {
    if (!search)
        return true;
    return String(search)
        .split(',')
        .every((s) => {
        const [value] = s.split(':').reverse();
        if (!value)
            return false;
        return true;
    });
}, {
    message: 'searchMustBe: value'
})
    .transform((searchString) => {
    if (!searchString)
        return null;
    const search = {};
    String(searchString)
        .split(',')
        .forEach((s) => {
        const propertyIndex = s.indexOf(':');
        const value = s.slice(propertyIndex + 1, s.length);
        const [field] = s.split(':');
        search[`${field}`] = value.trim();
    });
    return search;
});
exports.SearchSchema = zod_1.z.object({ search: zod_1.z.record(zod_1.z.string().trim(), zod_1.z.number().or(zod_1.z.string())).nullable() });
//# sourceMappingURL=search.js.map