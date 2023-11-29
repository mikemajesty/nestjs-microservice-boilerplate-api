"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwagggerRequest = exports.SwagggerResponse = void 0;
const request_1 = require("../../utils/docs/data/user/request");
const response_1 = require("../../utils/docs/data/user/response");
const swagger_1 = require("../../utils/docs/swagger");
exports.SwagggerResponse = {
    create: {
        200: swagger_1.Swagger.defaultResponseJSON({
            status: 200,
            json: response_1.UsersResponse.create,
            description: 'user created.'
        }),
        409: swagger_1.Swagger.defaultResponseError({
            status: 409,
            route: 'api/users',
            message: 'userExists',
            description: 'user exists.'
        })
    },
    update: {
        200: swagger_1.Swagger.defaultResponseJSON({
            status: 200,
            json: response_1.UsersResponse.update,
            description: 'user updated.'
        }),
        404: swagger_1.Swagger.defaultResponseError({
            status: 404,
            route: 'api/users',
            message: 'userNotFound',
            description: 'user not found.'
        }),
        409: swagger_1.Swagger.defaultResponseError({
            status: 409,
            route: 'api/users',
            message: 'userExists',
            description: 'user exists.'
        })
    },
    getByID: {
        200: swagger_1.Swagger.defaultResponseJSON({
            status: 200,
            json: response_1.UsersResponse.getByID,
            description: 'user found.'
        }),
        404: swagger_1.Swagger.defaultResponseError({
            status: 404,
            route: 'api/users/:id',
            message: 'userNotFound',
            description: 'user not found.'
        })
    },
    delete: {
        200: swagger_1.Swagger.defaultResponseJSON({
            status: 200,
            json: response_1.UsersResponse.delete,
            description: 'user found.'
        }),
        404: swagger_1.Swagger.defaultResponseError({
            status: 404,
            route: 'api/users/:id',
            message: 'userNotFound',
            description: 'user not found.'
        })
    },
    list: {
        200: swagger_1.Swagger.defaultResponseJSON({
            status: 200,
            json: response_1.UsersResponse.list,
            description: 'user created.'
        })
    }
};
exports.SwagggerRequest = {
    createBody: swagger_1.Swagger.defaultRequestJSON(request_1.UsersRequest.create),
    updateBody: swagger_1.Swagger.defaultRequestJSON(request_1.UsersRequest.update),
    listQuery: {
        pagination: {
            limit: swagger_1.Swagger.defaultApiQueryOptions({ example: 10, name: 'limit', required: false }),
            page: swagger_1.Swagger.defaultApiQueryOptions({ example: 1, name: 'page', required: false })
        },
        sort: swagger_1.Swagger.defaultApiQueryOptions({
            name: 'sort',
            required: false,
            description: `<b>createdAt:desc,login:asc`
        }),
        search: swagger_1.Swagger.defaultApiQueryOptions({
            name: 'search',
            required: false,
            description: `<b>login:value<login>`
        })
    }
};
//# sourceMappingURL=swagger.js.map