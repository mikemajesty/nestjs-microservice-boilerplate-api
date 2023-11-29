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
    logout: {
        200: _swagger.Swagger.defaultResponseJSON({
            status: 401,
            json: undefined,
            description: 'user logout'
        })
    }
};
const SwagggerRequest = {
    body: _swagger.Swagger.defaultRequestJSON({
        token: '<token>'
    })
};

//# sourceMappingURL=swagger.js.map