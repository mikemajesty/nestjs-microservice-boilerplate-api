"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwagggerRequest = exports.SwagggerResponse = void 0;
const request_1 = require("../../utils/docs/data/cats/request");
const response_1 = require("../../utils/docs/data/cats/response");
const swagger_1 = require("../../utils/docs/swagger");
exports.SwagggerResponse = {
    create: {
        200: swagger_1.Swagger.defaultResponseJSON({
            status: 200,
            json: response_1.CatsResponse.create,
            description: 'cat created.'
        })
    },
    update: {
        200: swagger_1.Swagger.defaultResponseJSON({
            status: 200,
            json: response_1.CatsResponse.update,
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
            json: response_1.CatsResponse.getByID,
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
            json: response_1.CatsResponse.delete,
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
            json: response_1.CatsResponse.list,
            description: 'cat created.'
        })
    }
};
exports.SwagggerRequest = {
    createBody: swagger_1.Swagger.defaultRequestJSON(request_1.CatsRequest.create),
    updateBody: swagger_1.Swagger.defaultRequestJSON(request_1.CatsRequest.update),
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