"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwagggerRequest = exports.SwagggerResponse = void 0;
const swagger_1 = require("../../utils/docs/swagger");
exports.SwagggerResponse = {
    login: {
        200: swagger_1.Swagger.defaultResponseJSON({
            status: 200,
            json: { token: '<token>' },
            description: 'user logged'
        }),
        404: swagger_1.Swagger.defaultResponseError({
            status: 404,
            route: 'api/login',
            message: 'userNotFound',
            description: 'username or password not found.'
        })
    }
};
exports.SwagggerRequest = {
    body: swagger_1.Swagger.defaultRequestJSON({
        login: 'admin',
        password: 'admin'
    })
};
//# sourceMappingURL=swagger.js.map