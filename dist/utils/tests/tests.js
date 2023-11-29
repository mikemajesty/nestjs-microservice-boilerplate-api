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
    expectZodError: function() {
        return expectZodError;
    },
    generateUUID: function() {
        return generateUUID;
    }
});
const _zod = require("zod");
const expectZodError = async (callback, expected)=>{
    try {
        await callback();
    } catch (error) {
        if (error instanceof _zod.z.ZodError) {
            const issues = error.issues.map(({ message, path })=>({
                    message,
                    path: path[0]
                }));
            expected(issues);
        }
    }
};
const generateUUID = ()=>'9269248e-54cc-46f9-80c0-7029c989c0e3';

//# sourceMappingURL=tests.js.map