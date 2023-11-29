"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "skipParentheses", {
    enumerable: true,
    get: function() {
        return skipParentheses;
    }
});
const skipParentheses = (filter)=>{
    return filter?.replace('(', '\\(')?.replace(')', '\\)');
};

//# sourceMappingURL=mongoose.js.map