"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUUID = exports.expectZodError = void 0;
const zod_1 = require("zod");
const expectZodError = async (callback, expected) => {
    try {
        await callback();
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const issues = error.issues.map(({ message, path }) => ({ message, path: path[0] }));
            expected(issues);
        }
    }
};
exports.expectZodError = expectZodError;
const generateUUID = () => '9269248e-54cc-46f9-80c0-7029c989c0e3';
exports.generateUUID = generateUUID;
//# sourceMappingURL=tests.js.map