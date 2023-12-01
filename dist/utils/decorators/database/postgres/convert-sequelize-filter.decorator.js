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
    ConvertSequelizeFilterToRepository: function() {
        return ConvertSequelizeFilterToRepository;
    },
    ListSchema: function() {
        return ListSchema;
    }
});
const _zod = require("zod");
const _pagination = require("../../../pagination");
const _search = require("../../../search");
const _sort = require("../../../sort");
const ListSchema = _zod.z.intersection(_pagination.PaginationSchema, _sort.SortSchema.merge(_search.SearchSchema));
function ConvertSequelizeFilterToRepository() {
    return (target, propertyKey, descriptor)=>{
        const originalMethod = descriptor.value;
        descriptor.value = function(...args) {
            const input = args[0];
            if (!input) {
                const result = originalMethod.apply(this, args);
                return result;
            }
            Object.assign(input, {
                deletedAt: null
            });
            args[0] = input;
            const result = originalMethod.apply(this, args);
            return result;
        };
    };
}

//# sourceMappingURL=convert-sequelize-filter.decorator.js.map