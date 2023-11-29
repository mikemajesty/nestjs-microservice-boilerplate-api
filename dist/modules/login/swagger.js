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
const _swagger = require("../../utils/docs/swagger");
const SwagggerResponse = {
    login: {
        200: _swagger.Swagger.defaultResponseJSON({
            status: 200,
            json: {
                token: '<token>'
            },
            description: 'user logged'
        }),
        404: _swagger.Swagger.defaultResponseError({
            status: 404,
            route: 'api/login',
            message: 'userNotFound',
            description: 'username or password not found.'
        })
    }
};
const SwagggerRequest = {
    body: _swagger.Swagger.defaultRequestJSON({
        login: 'admin',
        password: 'admin'
    })
};

//# sourceMappingURL=swagger.js.map