"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UserRepository", {
    enumerable: true,
    get: function() {
        return UserRepository;
    }
});
const _common = require("@nestjs/common");
const _mongoose = require("@nestjs/mongoose");
const _user = require("../../core/user/entity/user");
const _userlist = require("../../core/user/use-cases/user-list");
const _user1 = require("../../infra/database/mongo/schemas/user");
const _repository = require("../../infra/repository");
const _mongoose1 = require("../../utils/database/mongoose");
const _validatemongoosefilterdecorator = require("../../utils/decorators/database/mongo/validate-mongoose-filter.decorator");
const _validatedatabasesortalloweddecorator = require("../../utils/decorators/database/validate-database-sort-allowed.decorator");
const _types = require("../../utils/decorators/types");
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
let UserRepository = class UserRepository extends _repository.MongoRepository {
    async existsOnUpdate(equalFilter, notEqualFilter) {
        const user = await this.entity.findOne({
            ...equalFilter,
            $nor: [
                {
                    _id: notEqualFilter.id
                }
            ]
        });
        return !!user;
    }
    async paginate({ limit, page, sort, search }) {
        const users = await this.entity.paginate(search, {
            page,
            limit,
            sort
        });
        return {
            docs: users.docs.map((u)=>new _user.UserEntity(u.toObject({
                    virtuals: true
                }))),
            limit,
            page,
            total: users.totalDocs
        };
    }
    constructor(entity){
        super(entity);
        this.entity = entity;
    }
};
_ts_decorate([
    (0, _validatemongoosefilterdecorator.ValidateMongooseFilter)([
        {
            name: 'login',
            type: _types.SearchTypeEnum.like
        }
    ]),
    (0, _validatedatabasesortalloweddecorator.ValidateDatabaseSortAllowed)('login', 'createdAt'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _userlist.UserListInput === "undefined" ? Object : _userlist.UserListInput
    ])
], UserRepository.prototype, "paginate", null);
UserRepository = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _mongoose.InjectModel)(_user1.User.name)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _mongoose1.MongoRepositoryModelSessionType === "undefined" ? Object : _mongoose1.MongoRepositoryModelSessionType
    ])
], UserRepository);

//# sourceMappingURL=repository.js.map