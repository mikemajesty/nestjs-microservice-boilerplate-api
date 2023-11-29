"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogoutController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const adapter_1 = require("./adapter");
const swagger_2 = require("./swagger");
let LogoutController = exports.LogoutController = class LogoutController {
    constructor(logoutService) {
        this.logoutService = logoutService;
    }
    async logout({ body, user, tracing }) {
        return this.logoutService.execute(body, { user, tracing });
    }
};
__decorate([
    (0, common_1.Post)('/logout'),
    (0, swagger_1.ApiResponse)(swagger_2.SwagggerResponse.logout[200]),
    (0, swagger_1.ApiBody)(swagger_2.SwagggerRequest.body),
    (0, common_1.HttpCode)(401),
    (0, common_1.Version)('1'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], LogoutController.prototype, "logout", null);
exports.LogoutController = LogoutController = __decorate([
    (0, common_1.Controller)(),
    (0, swagger_1.ApiTags)('logout'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [adapter_1.ILogoutAdapter])
], LogoutController);
//# sourceMappingURL=controller.js.map