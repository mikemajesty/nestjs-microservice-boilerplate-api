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
const _request = require("../../utils/docs/data/user/request");
const _response = require("../../utils/docs/data/user/response");
const _swagger = require("../../utils/docs/swagger");
const SwagggerResponse = {
    create: {
        200: _swagger.Swagger.defaultResponseJSON({
            status: 200,
            json: _response.UsersResponse.create,
            description: 'user created.'
        }),
        409: _swagger.Swagger.defaultResponseError({
            status: 409,
            route: 'api/users',
            message: 'userExists',
            description: 'user exists.'
        })
    },
    update: {
        200: _swagger.Swagger.defaultResponseJSON({
            status: 200,
            json: _response.UsersResponse.update,
            description: 'user updated.'
        }),
        404: _swagger.Swagger.defaultResponseError({
            status: 404,
            route: 'api/users',
            message: 'userNotFound',
            description: 'user not found.'
        }),
        409: _swagger.Swagger.defaultResponseError({
            status: 409,
            route: 'api/users',
            message: 'userExists',
            description: 'user exists.'
        })
    },
    getByID: {
        200: _swagger.Swagger.defaultResponseJSON({
            status: 200,
            json: _response.UsersResponse.getByID,
            description: 'user found.'
        }),
        404: _swagger.Swagger.defaultResponseError({
            status: 404,
            route: 'api/users/:id',
            message: 'userNotFound',
            description: 'user not found.'
        })
    },
    delete: {
        200: _swagger.Swagger.defaultResponseJSON({
            status: 200,
            json: _response.UsersResponse.delete,
            description: 'user found.'
        }),
        404: _swagger.Swagger.defaultResponseError({
            status: 404,
            route: 'api/users/:id',
            message: 'userNotFound',
            description: 'user not found.'
        })
    },
    list: {
        200: _swagger.Swagger.defaultResponseJSON({
            status: 200,
            json: _response.UsersResponse.list,
            description: 'user created.'
        })
    }
};
const SwagggerRequest = {
    createBody: _swagger.Swagger.defaultRequestJSON(_request.UsersRequest.create),
    updateBody: _swagger.Swagger.defaultRequestJSON(_request.UsersRequest.update),
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
            description: `<b>createdAt:desc,login:asc`
        }),
        search: _swagger.Swagger.defaultApiQueryOptions({
            name: 'search',
            required: false,
            description: `<b>login:value<login>`
        })
    }
};

//# sourceMappingURL=swagger.js.map