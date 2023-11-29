"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    UserListSchema: function() {
        return UserListSchema;
    },
    UserListUsecase: function() {
        return UserListUsecase;
    }
});
const _zod = require("zod");
const _validateschemadecorator = require("../../../utils/decorators/validate-schema.decorator");
const _pagination = require("../../../utils/pagination");
const _search = require("../../../utils/search");
const _sort = require("../../../utils/sort");
const _user = require("../entity/user");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
const UserListSchema = _zod.z.intersection(_pagination.PaginationSchema, _sort.SortSchema.merge(_search.SearchSchema));
let UserListUsecase = class UserListUsecase {
    async execute(input) {
        const users = await this.userRepository.paginate(input);
        return {
            docs: users.docs.map((u)=>{
                const model = new _user.UserEntity(u);
                model.anonymizePassword();
                return model;
            }),
            limit: users.limit,
            page: users.page,
            total: users.total
        };
    }
    constructor(userRepository){
        this.userRepository = userRepository;
    }
};
_ts_decorate([
    (0, _validateschemadecorator.ValidateSchema)(UserListSchema),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof UserListInput === "undefined" ? Object : UserListInput
    ])
], UserListUsecase.prototype, "execute", null);

//# sourceMappingURL=user-list.js.map