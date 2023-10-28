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
exports.CatsListUsecase = exports.CatsListSchema = void 0;
const zod_1 = require("zod");
const validate_schema_decorator_1 = require("../../../utils/decorators/validate-schema.decorator");
const pagination_1 = require("../../../utils/pagination");
const search_1 = require("../../../utils/search");
const sort_1 = require("../../../utils/sort");
exports.CatsListSchema = zod_1.z.intersection(pagination_1.PaginationSchema, sort_1.SortSchema.merge(search_1.SearchSchema));
class CatsListUsecase {
    constructor(catsRepository) {
        this.catsRepository = catsRepository;
    }
    async execute(input) {
        return await this.catsRepository.paginate(input);
    }
}
__decorate([
    (0, validate_schema_decorator_1.ValidateSchema)(exports.CatsListSchema),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CatsListUsecase.prototype, "execute", null);
exports.CatsListUsecase = CatsListUsecase;
//# sourceMappingURL=cats-list.js.map