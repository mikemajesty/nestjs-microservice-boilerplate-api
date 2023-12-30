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
exports.UserRepository = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const user_1 = require("../../core/user/entity/user");
const user_2 = require("../../infra/database/mongo/schemas/user");
const repository_1 = require("../../infra/repository");
const validate_mongoose_filter_decorator_1 = require("../../utils/decorators/database/mongo/validate-mongoose-filter.decorator");
const validate_database_sort_allowed_decorator_1 = require("../../utils/decorators/database/validate-database-sort-allowed.decorator");
const types_1 = require("../../utils/decorators/types");
let UserRepository = exports.UserRepository = class UserRepository extends repository_1.MongoRepository {
    constructor(entity) {
        super(entity);
        this.entity = entity;
    }
    async startSession() {
        const session = await this.entity.connection.startSession();
        session.startTransaction();
        return session;
    }
    async existsOnUpdate(equalFilter, notEqualFilter) {
        const user = await this.entity.findOne(Object.assign(Object.assign({}, equalFilter), { $nor: [{ _id: notEqualFilter.id }] }));
        return !!user;
    }
    async paginate({ limit, page, sort, search }) {
        const users = await this.entity.paginate(search, { page, limit, sort });
        return {
            docs: users.docs.map((u) => new user_1.UserEntity(u.toObject({ virtuals: true }))),
            limit,
            page,
            total: users.totalDocs
        };
    }
};
__decorate([
    (0, validate_mongoose_filter_decorator_1.ValidateMongooseFilter)([{ name: 'login', type: types_1.SearchTypeEnum.like }]),
    (0, validate_database_sort_allowed_decorator_1.ValidateDatabaseSortAllowed)('login', 'createdAt'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserRepository.prototype, "paginate", null);
exports.UserRepository = UserRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_2.User.name)),
    __metadata("design:paramtypes", [Object])
], UserRepository);
//# sourceMappingURL=repository.js.map