"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ValidateSchema", {
    enumerable: true,
    get: function() {
        return ValidateSchema;
    }
});
function ValidateSchema(schema) {
    return (target, propertyKey, descriptor)=>{
        const originalMethod = descriptor.value;
        descriptor.value = function(...args) {
            const model = schema.parse(args[0]);
            args[0] = model;
            const result = originalMethod.apply(this, args);
            return result;
        };
    };
}

//# sourceMappingURL=validate-schema.decorator.js.map