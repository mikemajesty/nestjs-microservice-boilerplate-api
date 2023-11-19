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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserListUsecase = exports.UserListSchema = void 0;
const zod_1 = require("zod");
const validate_schema_decorator_1 = require("../../../utils/decorators/validate-schema.decorator");
const pagination_1 = require("../../../utils/pagination");
const search_1 = require("../../../utils/search");
const sort_1 = require("../../../utils/sort");
const user_1 = require("../entity/user");
exports.UserListSchema = zod_1.z.intersection(pagination_1.PaginationSchema, sort_1.SortSchema.merge(search_1.SearchSchema));
class UserListUsecase {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(input) {
        const users = await this.userRepository.paginate(input);
        return {
            docs: users.docs.map((u) => {
                const model = new user_1.UserEntity(u);
                model.anonymizePassword();
                return model;
            }),
            limit: users.limit,
            page: users.page,
            total: users.total
        };
    }
}
exports.UserListUsecase = UserListUsecase;
__decorate([
    (0, validate_schema_decorator_1.ValidateSchema)(exports.UserListSchema),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserListUsecase.prototype, "execute", null);
//# sourceMappingURL=user-list.js.map