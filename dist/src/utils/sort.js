"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SortSchema = exports.SortHttpSchema = exports.SortEnum = void 0;
const zod_1 = require("zod");
var SortEnum;
(function (SortEnum) {
    SortEnum[SortEnum["asc"] = 1] = "asc";
    SortEnum[SortEnum["desc"] = -1] = "desc";
})(SortEnum = exports.SortEnum || (exports.SortEnum = {}));
exports.SortHttpSchema = zod_1.z
    .string()
    .optional()
    .refine((check) => {
    if (!check)
        return true;
    return [!check.startsWith(':'), check.includes(':')].every(Boolean);
}, {
    message: 'invalidSortFormat'
})
    .refine((sort) => {
    if (!sort)
        return true;
    return String(sort)
        .split(',')
        .every((s) => {
        const [order] = s.split(':').reverse();
        return ['asc', 'desc'].includes(order.trim().toLowerCase() || 'asc');
    });
}, {
    message: 'invalidSortOrderMustBe: asc, desc'
})
    .transform((sort) => {
    const sortDefault = sort || 'createdAt:desc';
    const order = Object.fromEntries(String(sort && !sort.includes('createdAt') ? sort : sortDefault)
        .split(',')
        .map((s) => {
        const [field, order] = s.split(':');
        const sorted = [field.trim(), SortEnum[(order.trim().toLowerCase() || 'asc')]];
        return sorted;
    }));
    return order;
});
exports.SortSchema = zod_1.z.object({
    sort: zod_1.z.record(zod_1.z.string().trim().min(1), zod_1.z.nativeEnum(SortEnum))
});
//# sourceMappingURL=sort.js.map