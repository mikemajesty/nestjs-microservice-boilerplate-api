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
exports.UserController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const user_1 = require("../../core/user/entity/user");
const role_decorator_1 = require("../../utils/decorators/role.decorator");
const search_1 = require("../../utils/search");
const sort_1 = require("../../utils/sort");
const adapter_1 = require("./adapter");
const swagger_2 = require("./swagger");
let UserController = class UserController {
    constructor(userCreateUsecase, userUpdateUsecase, userDeleteUsecase, userListUsecase, userGetByIDUsecase) {
        this.userCreateUsecase = userCreateUsecase;
        this.userUpdateUsecase = userUpdateUsecase;
        this.userDeleteUsecase = userDeleteUsecase;
        this.userListUsecase = userListUsecase;
        this.userGetByIDUsecase = userGetByIDUsecase;
    }
    async create({ body, user, tracing }) {
        return this.userCreateUsecase.execute(body, { user, tracing });
    }
    async update({ body, user, tracing }) {
        return this.userUpdateUsecase.execute(body, { user, tracing });
    }
    async list({ query }) {
        const input = {
            sort: sort_1.SortHttpSchema.parse(query.sort),
            search: search_1.SearchHttpSchema.parse(query.search),
            limit: Number(query.limit),
            page: Number(query.page)
        };
        return await this.userListUsecase.execute(input);
    }
    async getById({ params }) {
        return await this.userGetByIDUsecase.execute(params);
    }
    async delete({ params, user, tracing }) {
        return await this.userDeleteUsecase.execute(params, { user, tracing });
    }
};
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiResponse)(swagger_2.SwagggerResponse.create[200]),
    (0, swagger_1.ApiResponse)(swagger_2.SwagggerResponse.create[409]),
    (0, swagger_1.ApiBody)(swagger_2.SwagggerRequest.createBody),
    (0, common_1.Version)('1'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(),
    (0, swagger_1.ApiResponse)(swagger_2.SwagggerResponse.update[200]),
    (0, swagger_1.ApiResponse)(swagger_2.SwagggerResponse.update[404]),
    (0, swagger_1.ApiResponse)(swagger_2.SwagggerResponse.update[409]),
    (0, swagger_1.ApiBody)(swagger_2.SwagggerRequest.updateBody),
    (0, common_1.Version)('1'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "update", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiQuery)(swagger_2.SwagggerRequest.listQuery.pagination.limit),
    (0, swagger_1.ApiQuery)(swagger_2.SwagggerRequest.listQuery.pagination.page),
    (0, swagger_1.ApiQuery)(swagger_2.SwagggerRequest.listQuery.sort),
    (0, swagger_1.ApiQuery)(swagger_2.SwagggerRequest.listQuery.search),
    (0, swagger_1.ApiResponse)(swagger_2.SwagggerResponse.list[200]),
    (0, common_1.Version)('1'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('/:id'),
    (0, swagger_1.ApiParam)({ name: 'id', required: true }),
    (0, swagger_1.ApiResponse)(swagger_2.SwagggerResponse.getByID[200]),
    (0, swagger_1.ApiResponse)(swagger_2.SwagggerResponse.getByID[404]),
    (0, common_1.Version)('1'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getById", null);
__decorate([
    (0, common_1.Delete)('/:id'),
    (0, swagger_1.ApiParam)({ name: 'id', required: true }),
    (0, swagger_1.ApiResponse)(swagger_2.SwagggerResponse.delete[200]),
    (0, swagger_1.ApiResponse)(swagger_2.SwagggerResponse.delete[404]),
    (0, common_1.Version)('1'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "delete", null);
UserController = __decorate([
    (0, common_1.Controller)('users'),
    (0, swagger_1.ApiTags)('users'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, role_decorator_1.Roles)(user_1.UserRole.BACKOFFICE),
    __metadata("design:paramtypes", [adapter_1.IUserCreateAdapter,
        adapter_1.IUserUpdateAdapter,
        adapter_1.IUserDeleteAdapter,
        adapter_1.IUserListAdapter,
        adapter_1.IUserGetByIDAdapter])
], UserController);
exports.UserController = UserController;
//# sourceMappingURL=controller.js.map