"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ValidateMongooseFilter", {
    enumerable: true,
    get: function() {
        return ValidateMongooseFilter;
    }
});
const _exception = require("../../../exception");
const _mongoose = require("../../../database/mongoose");
const _types = require("../../types");
function ValidateMongooseFilter(allowedFilterList = []) {
    return (target, propertyKey, descriptor)=>{
        const originalMethod = descriptor.value;
        descriptor.value = function(...args) {
            const input = args[0];
            const where = {};
            where['deletedAt'] = null;
            if (input?.search?.id) {
                where['_id'] = input.search.id.trim();
                delete input.search.id;
            }
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
                    where[allowedFilter.name] = new RegExp((0, _mongoose.skipParentheses)(filter), 'gi');
                }
            }
            args[0].search = where;
            const result = originalMethod.apply(this, args);
            return result;
        };
    };
}

//# sourceMappingURL=validate-mongoose-filter.decorator.js.map