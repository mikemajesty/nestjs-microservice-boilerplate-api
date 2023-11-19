"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.skipParentheses = void 0;
const skipParentheses = (filter) => {
    var _a;
    return (_a = filter === null || filter === void 0 ? void 0 : filter.replace('(', '\\(')) === null || _a === void 0 ? void 0 : _a.replace(')', '\\)');
};
exports.skipParentheses = skipParentheses;
//# sourceMappingURL=mongoose.js.map