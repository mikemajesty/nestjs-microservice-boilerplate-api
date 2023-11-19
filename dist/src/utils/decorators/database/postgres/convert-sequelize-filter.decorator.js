"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConvertSequelizeFilterToRepository = exports.ListSchema = void 0;
const zod_1 = require("zod");
const pagination_1 = require("../../../pagination");
const search_1 = require("../../../search");
const sort_1 = require("../../../sort");
exports.ListSchema = zod_1.z.intersection(pagination_1.PaginationSchema, sort_1.SortSchema.merge(search_1.SearchSchema));
function ConvertSequelizeFilterToRepository() {
    return (target, propertyKey, descriptor) => {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args) {
            const input = args[0];
            if (!input) {
                const result = originalMethod.apply(this, args);
                return result;
            }
            Object.assign(input, { deletedAt: null });
            args[0] = input;
            const result = originalMethod.apply(this, args);
            return result;
        };
    };
}
exports.ConvertSequelizeFilterToRepository = ConvertSequelizeFilterToRepository;
//# sourceMappingURL=convert-sequelize-filter.decorator.js.map