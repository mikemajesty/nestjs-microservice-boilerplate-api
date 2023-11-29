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
    ConvertPaginateInputToSequelizeFilter: function() {
        return ConvertPaginateInputToSequelizeFilter;
    },
    ListSchema: function() {
        return ListSchema;
    }
});
const _sequelize = require("sequelize");
const _zod = require("zod");
const _types = require("../../types");
const _exception = require("../../../exception");
const _pagination = require("../../../pagination");
const _search = require("../../../search");
const _sort = require("../../../sort");
const SequelizeSort = {
    '1': 'ASC',
    '-1': 'DESC'
};
const ListSchema = _zod.z.intersection(_pagination.PaginationSchema, _sort.SortSchema.merge(_search.SearchSchema));
function ConvertPaginateInputToSequelizeFilter(allowedFilterList) {
    return (target, propertyKey, descriptor)=>{
        const originalMethod = descriptor.value;
        descriptor.value = function(...args) {
            const input = args[0];
            const postgresSort = [];
            const where = {
                deletedAt: null
            };
            const filterNameList = allowedFilterList.map((f)=>f.name);
            Object.keys(input.search || {}).forEach((key)=>{
                const allowed = filterNameList.includes(key);
                if (!allowed) throw new _exception.ApiBadRequestException(`allowed filters are: ${filterNameList.join(', ')}`);
            });
            for (const allowedFilter of allowedFilterList){
                if (!input.search) continue;
                const filter = input.search[allowedFilter.name];
                if (!filter) continue;
                if (allowedFilter.type === _types.SearchTypeEnum.equal) {
                    where[allowedFilter.name] = filter;
                }
                if (allowedFilter.type === _types.SearchTypeEnum.like) {
                    where[allowedFilter.name] = {
                        [_sequelize.Op.iLike]: `%${filter}%`
                    };
                }
            }
            for(const key in input?.sort){
                const sort = input.sort[`${key}`];
                postgresSort.push([
                    key,
                    SequelizeSort[`${sort}`]
                ]);
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

//# sourceMappingURL=convert-paginate-input-to-sequelize-filter.decorator.js.map