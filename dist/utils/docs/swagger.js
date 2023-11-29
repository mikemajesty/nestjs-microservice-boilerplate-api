"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "Swagger", {
    enumerable: true,
    get: function() {
        return Swagger;
    }
});
const _htttpstatusjson = /*#__PURE__*/ _interop_require_default(require("../static/htttp-status.json"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const Swagger = {
    defaultResponseError ({ status, route, message, description }) {
        return {
            schema: {
                example: {
                    error: {
                        code: status,
                        traceid: '<traceid>',
                        message: [
                            message,
                            _htttpstatusjson.default[String(status)]
                        ].find(Boolean),
                        timestamp: '<timestamp>',
                        path: route
                    }
                }
            },
            description,
            status
        };
    },
    defaultResponseText ({ status, text, description }) {
        return {
            content: {
                'text/plain': {
                    schema: {
                        example: text
                    }
                }
            },
            description,
            status
        };
    },
    defaultResponseJSON ({ status, json, description }) {
        return {
            content: json ? {
                'application/json': {
                    schema: {
                        example: json
                    }
                }
            } : undefined,
            description,
            status
        };
    },
    defaultRequestJSON (json) {
        return {
            schema: {
                example: json
            }
        };
    },
    defaultApiQueryOptions ({ example, name, required, description }) {
        return {
            schema: {
                example
            },
            required,
            name,
            description,
            explode: true,
            type: 'string'
        };
    }
};

//# sourceMappingURL=swagger.js.map