"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = require("../../core/user/entity/user");
const Schema = user_1.UserEntitySchema.pick({
    login: true,
    password: true,
    roles: true
});
//# sourceMappingURL=types.js.map