"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConvertMongoFilterToBaseRepository = void 0;
function ConvertMongoFilterToBaseRepository() {
    return (target, propertyKey, descriptor) => {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args) {
            const input = args[0];
            if (!input) {
                const result = originalMethod.apply(this, args);
                return result;
            }
            input['deletedAt'] = null;
            if (input.id) {
                input['_id'] = input.id;
                delete input.id;
            }
            args[0] = input;
            const result = originalMethod.apply(this, args);
            return result;
        };
    };
}
exports.ConvertMongoFilterToBaseRepository = ConvertMongoFilterToBaseRepository;
//# sourceMappingURL=convert-mongoose-filter.decorator.js.map