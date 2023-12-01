"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "HealthController", {
    enumerable: true,
    get: function() {
        return HealthController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _packagejson = require("package.json");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let HealthController = class HealthController {
    async getHealth() {
        return `${_packagejson.name}:${_packagejson.version} available!`;
    }
};
_ts_decorate([
    (0, _common.Get)([
        '/health',
        '/'
    ]),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [])
], HealthController.prototype, "getHealth", null);
HealthController = _ts_decorate([
    (0, _common.Controller)(),
    (0, _swagger.ApiTags)('health')
], HealthController);

//# sourceMappingURL=controller.js.map