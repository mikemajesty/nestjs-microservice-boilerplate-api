"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Swagger = void 0;
const htttp_status_json_1 = __importDefault(require("../static/htttp-status.json"));
exports.Swagger = {
    defaultResponseError({ status, route, message, description }) {
        return {
            schema: {
                example: {
                    error: {
                        code: status,
                        traceid: '<traceid>',
                        message: [message, htttp_status_json_1.default[String(status)]].find(Boolean),
                        timestamp: '<timestamp>',
                        path: route
                    }
                }
            },
            description,
            status
        };
    },
    defaultResponseText({ status, text, description }) {
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
    defaultResponseJSON({ status, json, description }) {
        return {
            content: json
                ? {
                    'application/json': {
                        schema: {
                            example: json
                        }
                    }
                }
                : undefined,
            description,
            status
        };
    },
    defaultRequestJSON(json) {
        return {
            schema: {
                example: json
            }
        };
    },
    defaultApiQueryOptions({ example, name, required, description }) {
        return {
            schema: { example },
            required,
            name,
            description,
            explode: true,
            type: 'string'
        };
    }
};
//# sourceMappingURL=swagger.js.map