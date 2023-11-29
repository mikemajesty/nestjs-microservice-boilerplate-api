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
exports.CatsRepository = void 0;
const common_1 = require("@nestjs/common");
const cats_1 = require("../../core/cats/entity/cats");
const repository_1 = require("../../infra/repository/postgres/repository");
const sequelize_1 = require("../../utils/database/sequelize");
const convert_paginate_input_to_sequelize_filter_decorator_1 = require("../../utils/decorators/database/postgres/convert-paginate-input-to-sequelize-filter.decorator");
const validate_database_sort_allowed_decorator_1 = require("../../utils/decorators/database/validate-database-sort-allowed.decorator");
const types_1 = require("../../utils/decorators/types");
let CatsRepository = exports.CatsRepository = class CatsRepository extends repository_1.SequelizeRepository {
    constructor(repository) {
        super(repository);
        this.repository = repository;
    }
    async startSession() {
        const transaction = await this.repository.sequelize.transaction();
        return transaction;
    }
    async paginate(input, options) {
        const { schema } = sequelize_1.DatabaseOptionsSchema.parse(options);
        const list = await this.repository.schema(schema).findAndCountAll(input);
        return { docs: list.rows.map((r) => new cats_1.CatsEntity(r)), limit: input.limit, page: input.page, total: list.count };
    }
};
__decorate([
    (0, validate_database_sort_allowed_decorator_1.ValidateDatabaseSortAllowed)('createdAt', 'breed'),
    (0, convert_paginate_input_to_sequelize_filter_decorator_1.ConvertPaginateInputToSequelizeFilter)([
        { name: 'name', type: types_1.SearchTypeEnum.like },
        { name: 'breed', type: types_1.SearchTypeEnum.like },
        { name: 'age', type: types_1.SearchTypeEnum.equal }
    ]),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CatsRepository.prototype, "paginate", null);
exports.CatsRepository = CatsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], CatsRepository);
//# sourceMappingURL=repository.js.map