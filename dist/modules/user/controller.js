"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UserController", {
    enumerable: true,
    get: function() {
        return UserController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _user = require("../../core/user/entity/user");
const _roledecorator = require("../../utils/decorators/role.decorator");
const _request = require("../../utils/request");
const _search = require("../../utils/search");
const _sort = require("../../utils/sort");
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
let UserController = class UserController {
    async create({ body, user, tracing }) {
        return this.userCreateUsecase.execute(body, {
            user,
            tracing
        });
    }
    async update({ body, user, tracing }) {
        return this.userUpdateUsecase.execute(body, {
            user,
            tracing
        });
    }
    async list({ query }) {
        const input = {
            sort: _sort.SortHttpSchema.parse(query.sort),
            search: _search.SearchHttpSchema.parse(query.search),
            limit: Number(query.limit),
            page: Number(query.page)
        };
        return await this.userListUsecase.execute(input);
    }
    async getById({ params }) {
        return await this.userGetByIDUsecase.execute(params);
    }
    async delete({ params, user, tracing }) {
        return await this.userDeleteUsecase.execute(params, {
            user,
            tracing
        });
    }
    constructor(userCreateUsecase, userUpdateUsecase, userDeleteUsecase, userListUsecase, userGetByIDUsecase){
        this.userCreateUsecase = userCreateUsecase;
        this.userUpdateUsecase = userUpdateUsecase;
        this.userDeleteUsecase = userDeleteUsecase;
        this.userListUsecase = userListUsecase;
        this.userGetByIDUsecase = userGetByIDUsecase;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    (0, _swagger.ApiResponse)(_swagger1.SwagggerResponse.create[200]),
    (0, _swagger.ApiResponse)(_swagger1.SwagggerResponse.create[409]),
    (0, _swagger.ApiBody)(_swagger1.SwagggerRequest.createBody),
    (0, _common.Version)('1'),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _request.ApiRequest === "undefined" ? Object : _request.ApiRequest
    ])
], UserController.prototype, "create", null);
_ts_decorate([
    (0, _common.Put)(),
    (0, _swagger.ApiResponse)(_swagger1.SwagggerResponse.update[200]),
    (0, _swagger.ApiResponse)(_swagger1.SwagggerResponse.update[404]),
    (0, _swagger.ApiResponse)(_swagger1.SwagggerResponse.update[409]),
    (0, _swagger.ApiBody)(_swagger1.SwagggerRequest.updateBody),
    (0, _common.Version)('1'),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _request.ApiRequest === "undefined" ? Object : _request.ApiRequest
    ])
], UserController.prototype, "update", null);
_ts_decorate([
    (0, _common.Get)(),
    (0, _swagger.ApiQuery)(_swagger1.SwagggerRequest.listQuery.pagination.limit),
    (0, _swagger.ApiQuery)(_swagger1.SwagggerRequest.listQuery.pagination.page),
    (0, _swagger.ApiQuery)(_swagger1.SwagggerRequest.listQuery.sort),
    (0, _swagger.ApiQuery)(_swagger1.SwagggerRequest.listQuery.search),
    (0, _swagger.ApiResponse)(_swagger1.SwagggerResponse.list[200]),
    (0, _common.Version)('1'),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _request.ApiRequest === "undefined" ? Object : _request.ApiRequest
    ])
], UserController.prototype, "list", null);
_ts_decorate([
    (0, _common.Get)('/:id'),
    (0, _swagger.ApiParam)({
        name: 'id',
        required: true
    }),
    (0, _swagger.ApiResponse)(_swagger1.SwagggerResponse.getByID[200]),
    (0, _swagger.ApiResponse)(_swagger1.SwagggerResponse.getByID[404]),
    (0, _common.Version)('1'),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _request.ApiRequest === "undefined" ? Object : _request.ApiRequest
    ])
], UserController.prototype, "getById", null);
_ts_decorate([
    (0, _common.Delete)('/:id'),
    (0, _swagger.ApiParam)({
        name: 'id',
        required: true
    }),
    (0, _swagger.ApiResponse)(_swagger1.SwagggerResponse.delete[200]),
    (0, _swagger.ApiResponse)(_swagger1.SwagggerResponse.delete[404]),
    (0, _common.Version)('1'),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _request.ApiRequest === "undefined" ? Object : _request.ApiRequest
    ])
], UserController.prototype, "delete", null);
UserController = _ts_decorate([
    (0, _common.Controller)('users'),
    (0, _swagger.ApiTags)('users'),
    (0, _swagger.ApiBearerAuth)(),
    (0, _roledecorator.Roles)(_user.UserRole.BACKOFFICE),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _adapter.IUserCreateAdapter === "undefined" ? Object : _adapter.IUserCreateAdapter,
        typeof _adapter.IUserUpdateAdapter === "undefined" ? Object : _adapter.IUserUpdateAdapter,
        typeof _adapter.IUserDeleteAdapter === "undefined" ? Object : _adapter.IUserDeleteAdapter,
        typeof _adapter.IUserListAdapter === "undefined" ? Object : _adapter.IUserListAdapter,
        typeof _adapter.IUserGetByIDAdapter === "undefined" ? Object : _adapter.IUserGetByIDAdapter
    ])
], UserController);

//# sourceMappingURL=controller.js.map