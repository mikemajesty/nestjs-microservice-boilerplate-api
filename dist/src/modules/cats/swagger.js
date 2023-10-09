"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwagggerRequest = exports.SwagggerResponse = void 0;
const cats_1 = require("../../utils/mocks/cats");
const swagger_1 = require("../../utils/swagger");
const entity = cats_1.catCreateMock;
const entityFull = cats_1.catResponseMock;
exports.SwagggerResponse = {
    create: {
        200: swagger_1.Swagger.defaultResponseJSON({
            status: 200,
            json: { created: true, id: '<uuid>' },
            description: 'cat created.'
        })
    },
    update: {
        200: swagger_1.Swagger.defaultResponseJSON({
            status: 200,
            json: entityFull,
            description: 'cat updated.'
        }),
        404: swagger_1.Swagger.defaultResponseError({
            status: 404,
            route: 'api/cats',
            message: 'catNotFound',
            description: 'cat not found.'
        })
    },
    getByID: {
        200: swagger_1.Swagger.defaultResponseJSON({
            status: 200,
            json: entityFull,
            description: 'cat found.'
        }),
        404: swagger_1.Swagger.defaultResponseError({
            status: 404,
            route: 'api/cats/:id',
            message: 'catNotFound',
            description: 'cat not found.'
        })
    },
    delete: {
        200: swagger_1.Swagger.defaultResponseJSON({
            status: 200,
            json: entityFull,
            description: 'cat found.'
        }),
        404: swagger_1.Swagger.defaultResponseError({
            status: 404,
            route: 'api/cats/:id',
            message: 'catNotFound',
            description: 'cat not found.'
        })
    },
    list: {
        200: swagger_1.Swagger.defaultResponseJSON({
            status: 200,
            json: { docs: { docs: [entityFull], page: 1, limit: 1, total: 1 } },
            description: 'cat created.'
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
            description: `<b>createdAt:desc,name:asc`
        }),
        search: swagger_1.Swagger.defaultApiQueryOptions({
            name: 'search',
            required: false,
            description: `<b>name:miau,breed:siamese`
        })
    }
};
//# sourceMappingURL=swagger.js.map