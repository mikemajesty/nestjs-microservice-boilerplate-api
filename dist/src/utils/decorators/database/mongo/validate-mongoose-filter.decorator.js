"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateMongooseFilter = void 0;
const exception_1 = require("../../../exception");
const mongoose_1 = require("../../../database/mongoose");
const types_1 = require("../../types");
function ValidateMongooseFilter(allowedFilterList = []) {
    return (target, propertyKey, descriptor) => {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args) {
            var _a;
            const input = args[0];
            const where = {};
            where['deletedAt'] = null;
            if ((_a = input === null || input === void 0 ? void 0 : input.search) === null || _a === void 0 ? void 0 : _a.id) {
                where['_id'] = input.search.id.trim();
                delete input.search.id;
            }
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
                    where[allowedFilter.name] = new RegExp((0, mongoose_1.skipParentheses)(filter), 'gi');
                }
            }
            args[0].search = where;
            const result = originalMethod.apply(this, args);
            return result;
        };
    };
}
exports.ValidateMongooseFilter = ValidateMongooseFilter;
//# sourceMappingURL=validate-mongoose-filter.decorator.js.map