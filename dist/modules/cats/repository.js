"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CatsRepository", {
    enumerable: true,
    get: function() {
        return CatsRepository;
    }
});
const _common = require("@nestjs/common");
const _cats = require("../../core/cats/entity/cats");
const _catslist = require("../../core/cats/use-cases/cats-list");
const _repository = require("../../infra/repository/postgres/repository");
const _sequelize = require("../../utils/database/sequelize");
const _convertpaginateinputtosequelizefilterdecorator = require("../../utils/decorators/database/postgres/convert-paginate-input-to-sequelize-filter.decorator");
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
let CatsRepository = class CatsRepository extends _repository.SequelizeRepository {
    async startSession() {
        const transaction = await this.repository.sequelize.transaction();
        return transaction;
    }
    async paginate(input, options) {
        const { schema } = _sequelize.DatabaseOptionsSchema.parse(options);
        const list = await this.repository.schema(schema).findAndCountAll(input);
        return {
            docs: list.rows.map((r)=>new _cats.CatsEntity(r)),
            limit: input.limit,
            page: input.page,
            total: list.count
        };
    }
    constructor(repository){
        super(repository);
        this.repository = repository;
    }
};
_ts_decorate([
    (0, _validatedatabasesortalloweddecorator.ValidateDatabaseSortAllowed)('createdAt', 'breed'),
    (0, _convertpaginateinputtosequelizefilterdecorator.ConvertPaginateInputToSequelizeFilter)([
        {
            name: 'name',
            type: _types.SearchTypeEnum.like
        },
        {
            name: 'breed',
            type: _types.SearchTypeEnum.like
        },
        {
            name: 'age',
            type: _types.SearchTypeEnum.equal
        }
    ]),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _catslist.CatsListInput === "undefined" ? Object : _catslist.CatsListInput,
        typeof _sequelize.DatabaseOptionsType === "undefined" ? Object : _sequelize.DatabaseOptionsType
    ])
], CatsRepository.prototype, "paginate", null);
CatsRepository = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof Model === "undefined" ? Object : Model
    ])
], CatsRepository);

//# sourceMappingURL=repository.js.map