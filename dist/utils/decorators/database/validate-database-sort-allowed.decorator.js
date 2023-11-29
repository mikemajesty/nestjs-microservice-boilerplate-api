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
    ListSchema: function() {
        return ListSchema;
    },
    ValidateDatabaseSortAllowed: function() {
        return ValidateDatabaseSortAllowed;
    }
});
const _zod = require("zod");
const _pagination = require("../../pagination");
const _search = require("../../search");
const _sort = require("../../sort");
const _exception = require("../../exception");
const ListSchema = _zod.z.intersection(_pagination.PaginationSchema, _sort.SortSchema.merge(_search.SearchSchema));
function ValidateDatabaseSortAllowed(...allowedSortList) {
    return (target, propertyKey, descriptor)=>{
        const originalMethod = descriptor.value;
        descriptor.value = function(...args) {
            const input = args[0];
            const sort = {};
            const sortList = allowedSortList || [];
            Object.keys(input.sort || {}).forEach((key)=>{
                const allowed = sortList.includes(key);
                if (!allowed) throw new _exception.ApiBadRequestException(`allowed sorts are: ${sortList.join(', ')}`);
            });
            for (const allowedFilter of sortList){
                if (!input.sort) continue;
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

//# sourceMappingURL=validate-database-sort-allowed.decorator.js.map