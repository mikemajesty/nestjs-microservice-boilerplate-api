"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calucaleSkip = exports.PaginationSchema = void 0;
const zod_1 = require("zod");
const maxLimit = (limit) => (limit > 100 ? 100 : limit);
exports.PaginationSchema = zod_1.z
    .object({
    page: zod_1.z.number().or(zod_1.z.string()).or(zod_1.z.nan()).default(1),
    limit: zod_1.z.number().or(zod_1.z.string()).or(zod_1.z.nan()).default(10)
})
    .transform((pagination) => {
    let limit = Number(pagination.limit);
    let page = Number(pagination.page);
    if (isNaN(limit)) {
        limit = 10;
    }
    if (isNaN(page)) {
        page = 1;
    }
    return {
        page: page > 0 ? +page : 1,
        limit: limit > 0 ? maxLimit(+limit) : 10
    };
})
    .refine((pagination) => Number.isInteger(pagination.page), {
    path: ['page'],
    message: 'invalidInteger'
})
    .refine((pagination) => Number.isInteger(pagination.limit), {
    path: ['limit'],
    message: 'invalidInteger'
});
const calucaleSkip = (input) => {
    return (input.page - 1) * input.limit;
};
exports.calucaleSkip = calucaleSkip;
//# sourceMappingURL=pagination.js.map