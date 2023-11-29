"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "MongoService", {
    enumerable: true,
    get: function() {
        return MongoService;
    }
});
const _packagejson = require("package.json");
let MongoService = class MongoService {
    getConnection({ URI }) {
        return {
            appName: _packagejson.name,
            uri: URI
        };
    }
};

//# sourceMappingURL=service.js.map