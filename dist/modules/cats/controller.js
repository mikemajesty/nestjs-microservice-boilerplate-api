"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CatsController", {
    enumerable: true,
    get: function() {
        return CatsController;
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
let CatsController = class CatsController {
    async create({ body, user, tracing }) {
        return await this.catsCreate.execute(body, {
            user,
            tracing
        });
    }
    async update({ body, user, tracing }) {
        return await this.catsUpdate.execute(body, {
            user,
            tracing
        });
    }
    async getById({ params }) {
        return await this.catsGetByID.execute(params);
    }
    async list({ query }) {
        const input = {
            sort: _sort.SortHttpSchema.parse(query.sort),
            search: _search.SearchHttpSchema.parse(query.search),
            limit: Number(query.limit),
            page: Number(query.page)
        };
        return await this.catsList.execute(input);
    }
    async delete({ params, user, tracing }) {
        return await this.catsDelete.execute(params, {
            user,
            tracing
        });
    }
    constructor(catsCreate, catsUpdate, catsGetByID, catsList, catsDelete){
        this.catsCreate = catsCreate;
        this.catsUpdate = catsUpdate;
        this.catsGetByID = catsGetByID;
        this.catsList = catsList;
        this.catsDelete = catsDelete;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    (0, _swagger.ApiResponse)(_swagger1.SwagggerResponse.create[200]),
    (0, _swagger.ApiBody)(_swagger1.SwagggerRequest.createBody),
    (0, _common.Version)('1'),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _request.ApiRequest === "undefined" ? Object : _request.ApiRequest
    ])
], CatsController.prototype, "create", null);
_ts_decorate([
    (0, _common.Put)(),
    (0, _swagger.ApiResponse)(_swagger1.SwagggerResponse.update[200]),
    (0, _swagger.ApiResponse)(_swagger1.SwagggerResponse.update[404]),
    (0, _swagger.ApiBody)(_swagger1.SwagggerRequest.updateBody),
    (0, _common.Version)('1'),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _request.ApiRequest === "undefined" ? Object : _request.ApiRequest
    ])
], CatsController.prototype, "update", null);
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
], CatsController.prototype, "getById", null);
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
], CatsController.prototype, "list", null);
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
], CatsController.prototype, "delete", null);
CatsController = _ts_decorate([
    (0, _common.Controller)('cats'),
    (0, _swagger.ApiTags)('cats'),
    (0, _swagger.ApiBearerAuth)(),
    (0, _roledecorator.Roles)(_user.UserRole.USER),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _adapter.ICatsCreateAdapter === "undefined" ? Object : _adapter.ICatsCreateAdapter,
        typeof _adapter.ICatsUpdateAdapter === "undefined" ? Object : _adapter.ICatsUpdateAdapter,
        typeof _adapter.ICatsGetByIDAdapter === "undefined" ? Object : _adapter.ICatsGetByIDAdapter,
        typeof _adapter.ICatsListAdapter === "undefined" ? Object : _adapter.ICatsListAdapter,
        typeof _adapter.ICatsDeleteAdapter === "undefined" ? Object : _adapter.ICatsDeleteAdapter
    ])
], CatsController);

//# sourceMappingURL=controller.js.map