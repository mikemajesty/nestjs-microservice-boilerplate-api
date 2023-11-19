"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoService = void 0;
const package_json_1 = require("../../../../package.json");
class MongoService {
    getConnection({ URI }) {
        return {
            appName: package_json_1.name,
            uri: URI
        };
    }
}
exports.MongoService = MongoService;
//# sourceMappingURL=service.js.map