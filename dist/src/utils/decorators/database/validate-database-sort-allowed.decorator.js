"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateDatabaseSortAllowed = exports.ListSchema = void 0;
const zod_1 = require("zod");
const pagination_1 = require("../../pagination");
const search_1 = require("../../search");
const sort_1 = require("../../sort");
const exception_1 = require("./../../exception");
exports.ListSchema = zod_1.z.intersection(pagination_1.PaginationSchema, sort_1.SortSchema.merge(search_1.SearchSchema));
function ValidateDatabaseSortAllowed(...allowedSortList) {
    return (target, propertyKey, descriptor) => {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args) {
            const input = args[0];
            const sort = {};
            const sortList = (allowedSortList || []);
            Object.keys(input.sort || {}).forEach((key) => {
                const allowed = sortList.includes(key);
                if (!allowed)
                    throw new exception_1.ApiBadRequestException(`allowed sorts are: ${sortList.join(', ')}`);
            });
            for (const allowedFilter of sortList) {
                if (!input.sort)
                    continue;
                const filter = input.sort[`${allowedFilter}`];
                if (filter) {
                    sort[`${allowedFilter}`] = filter;
                }
            }
            args[0].sort = sort;
            const result = originalMethod.apply(this, args);
            return result;
        };
    };
}
exports.ValidateDatabaseSortAllowed = ValidateDatabaseSortAllowed;
//# sourceMappingURL=validate-database-sort-allowed.decorator.js.map