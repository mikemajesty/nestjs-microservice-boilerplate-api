"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConvertPaginateInputToSequelizeFilter = exports.ListSchema = void 0;
const sequelize_1 = require("sequelize");
const zod_1 = require("zod");
const types_1 = require("../../types");
const exception_1 = require("../../../exception");
const pagination_1 = require("../../../pagination");
const search_1 = require("../../../search");
const sort_1 = require("../../../sort");
const SequelizeSort = {
    '1': 'ASC',
    '-1': 'DESC'
};
exports.ListSchema = zod_1.z.intersection(pagination_1.PaginationSchema, sort_1.SortSchema.merge(search_1.SearchSchema));
function ConvertPaginateInputToSequelizeFilter(allowedFilterList) {
    return (target, propertyKey, descriptor) => {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args) {
            const input = args[0];
            const postgresSort = [];
            const where = {
                deletedAt: null
            };
            const filterNameList = allowedFilterList.map((f) => f.name);
            Object.keys(input.search || {}).forEach((key) => {
                const allowed = filterNameList.includes(key);
                if (!allowed)
                    throw new exception_1.ApiBadRequestException(`allowed filters are: ${filterNameList.join(', ')}`);
            });
            for (const allowedFilter of allowedFilterList) {
                if (!input.search)
                    continue;
                const filter = input.search[allowedFilter.name];
                if (!filter)
                    continue;
                if (allowedFilter.type === types_1.SearchTypeEnum.equal) {
                    where[allowedFilter.name] = filter;
                }
                if (allowedFilter.type === types_1.SearchTypeEnum.like) {
                    where[allowedFilter.name] = { [sequelize_1.Op.iLike]: `%${filter}%` };
                }
            }
            for (const key in input === null || input === void 0 ? void 0 : input.sort) {
                const sort = input.sort[`${key}`];
                postgresSort.push([key, SequelizeSort[`${sort}`]]);
            }
            const limit = Number(input.limit);
            const offset = Number(input.page - 1) * limit;
            const filter = {
                offset,
                limit,
                order: postgresSort,
                where,
                page: input.page
            };
            args[0] = filter;
            const result = originalMethod.apply(this, args);
            return result;
        };
    };
}
exports.ConvertPaginateInputToSequelizeFilter = ConvertPaginateInputToSequelizeFilter;
//# sourceMappingURL=convert-paginate-input-to-sequelize-filter.decorator.js.map