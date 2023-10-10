"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwagggerRequest = exports.SwagggerResponse = void 0;
const swagger_1 = require("../../utils/swagger");
const user_1 = require("../../utils/tests/mocks/user");
const entity = user_1.userCreateMock;
const entityFull = user_1.userResponseMock;
exports.SwagggerResponse = {
    create: {
        200: swagger_1.Swagger.defaultResponseJSON({
            status: 200,
            json: { created: true, id: '<uuid>' },
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
            json: entityFull,
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
            json: entityFull,
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
            json: entityFull,
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
            json: { docs: { docs: [entityFull], page: 1, limit: 1, total: 1 } },
            description: 'user created.'
        })
    }
};
exports.SwagggerRequest = {
    createBody: swagger_1.Swagger.defaultRequestJSON(Object.assign(Object.assign({}, entity), { id: undefined })),
    updateBody: swagger_1.Swagger.defaultRequestJSON(Object.assign(Object.assign({}, entity), { id: '<id>' })),
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