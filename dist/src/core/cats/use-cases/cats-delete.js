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
exports.CatsDeleteUsecase = exports.CatsDeleteSchema = void 0;
const validate_schema_decorator_1 = require("../../../utils/decorators/validate-schema.decorator");
const exception_1 = require("../../../utils/exception");
const cats_1 = require("../entity/cats");
exports.CatsDeleteSchema = cats_1.CatsEntitySchema.pick({
    id: true
});
class CatsDeleteUsecase {
    constructor(catsRepository) {
        this.catsRepository = catsRepository;
    }
    async execute({ id }, { tracing, user }) {
        const model = await this.catsRepository.findById(id);
        if (!model) {
            throw new exception_1.ApiNotFoundException();
        }
        const cats = new cats_1.CatsEntity(model);
        cats.setDeleted();
        await this.catsRepository.updateOne({ id: cats.id }, cats);
        tracing.logEvent('cats-deleted', `cats deleted by: ${user.login}`);
        return cats;
    }
}
exports.CatsDeleteUsecase = CatsDeleteUsecase;
__decorate([
    (0, validate_schema_decorator_1.ValidateSchema)(exports.CatsDeleteSchema),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CatsDeleteUsecase.prototype, "execute", null);
//# sourceMappingURL=cats-delete.js.map