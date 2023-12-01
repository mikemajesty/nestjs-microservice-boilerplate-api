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
    SwagggerRequest: function() {
        return SwagggerRequest;
    },
    SwagggerResponse: function() {
        return SwagggerResponse;
    }
});
const _request = require("../../utils/docs/data/cats/request");
const _response = require("../../utils/docs/data/cats/response");
const _swagger = require("../../utils/docs/swagger");
const SwagggerResponse = {
    create: {
        200: _swagger.Swagger.defaultResponseJSON({
            status: 200,
            json: _response.CatsResponse.create,
            description: 'cat created.'
        })
    },
    update: {
        200: _swagger.Swagger.defaultResponseJSON({
            status: 200,
            json: _response.CatsResponse.update,
            description: 'cat updated.'
        }),
        404: _swagger.Swagger.defaultResponseError({
            status: 404,
            route: 'api/cats',
            message: 'catNotFound',
            description: 'cat not found.'
        })
    },
    getByID: {
        200: _swagger.Swagger.defaultResponseJSON({
            status: 200,
            json: _response.CatsResponse.getByID,
            description: 'cat found.'
        }),
        404: _swagger.Swagger.defaultResponseError({
            status: 404,
            route: 'api/cats/:id',
            message: 'catNotFound',
            description: 'cat not found.'
        })
    },
    delete: {
        200: _swagger.Swagger.defaultResponseJSON({
            status: 200,
            json: _response.CatsResponse.delete,
            description: 'cat found.'
        }),
        404: _swagger.Swagger.defaultResponseError({
            status: 404,
            route: 'api/cats/:id',
            message: 'catNotFound',
            description: 'cat not found.'
        })
    },
    list: {
        200: _swagger.Swagger.defaultResponseJSON({
            status: 200,
            json: _response.CatsResponse.list,
            description: 'cat created.'
        })
    }
};
const SwagggerRequest = {
    createBody: _swagger.Swagger.defaultRequestJSON(_request.CatsRequest.create),
    updateBody: _swagger.Swagger.defaultRequestJSON(_request.CatsRequest.update),
    listQuery: {
        pagination: {
            limit: _swagger.Swagger.defaultApiQueryOptions({
                example: 10,
                name: 'limit',
                required: false
            }),
            page: _swagger.Swagger.defaultApiQueryOptions({
                example: 1,
                name: 'page',
                required: false
            })
        },
        sort: _swagger.Swagger.defaultApiQueryOptions({
            name: 'sort',
            required: false,
            description: `<b>createdAt:desc,name:asc`
        }),
        search: _swagger.Swagger.defaultApiQueryOptions({
            name: 'search',
            required: false,
            description: `<b>name:miau,breed:siamese`
        })
    }
};

//# sourceMappingURL=swagger.js.map