"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "LoginController", {
    enumerable: true,
    get: function() {
        return LoginController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _request = require("../../utils/request");
const _adapter = require("./adapter");
const _swagger1 = require("./swagger");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let LoginController = class LoginController {
    async login({ body, user, tracing }) {
        return this.loginService.execute(body, {
            user,
            tracing
        });
    }
    constructor(loginService){
        this.loginService = loginService;
    }
};
_ts_decorate([
    (0, _common.Post)('/login'),
    (0, _swagger.ApiResponse)(_swagger1.SwagggerResponse.login[200]),
    (0, _swagger.ApiResponse)(_swagger1.SwagggerResponse.login[404]),
    (0, _swagger.ApiBody)(_swagger1.SwagggerRequest.body),
    (0, _common.Version)('1'),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _request.ApiRequest === "undefined" ? Object : _request.ApiRequest
    ])
], LoginController.prototype, "login", null);
LoginController = _ts_decorate([
    (0, _common.Controller)(),
    (0, _swagger.ApiTags)('login'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _adapter.ILoginAdapter === "undefined" ? Object : _adapter.ILoginAdapter
    ])
], LoginController);

//# sourceMappingURL=controller.js.map