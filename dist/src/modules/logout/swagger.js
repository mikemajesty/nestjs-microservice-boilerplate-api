"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwagggerRequest = exports.SwagggerResponse = void 0;
const swagger_1 = require("../../utils/docs/swagger");
exports.SwagggerResponse = {
    logout: {
        200: swagger_1.Swagger.defaultResponseJSON({
            status: 401,
            json: undefined,
            description: 'user logout'
        })
    }
};
exports.SwagggerRequest = {
    body: swagger_1.Swagger.defaultRequestJSON({
        token: '<token>'
    })
};
//# sourceMappingURL=swagger.js.map