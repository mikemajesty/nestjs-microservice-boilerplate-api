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
exports.CatsUpdateUsecase = exports.CatsUpdateSchema = void 0;
const validate_schema_decorator_1 = require("../../../utils/decorators/validate-schema.decorator");
const exception_1 = require("../../../utils/exception");
const cats_1 = require("./../entity/cats");
exports.CatsUpdateSchema = cats_1.CatsEntitySchema.pick({
    id: true
}).merge(cats_1.CatsEntitySchema.omit({ id: true }).partial());
class CatsUpdateUsecase {
    constructor(catsRepository, loggerServide) {
        this.catsRepository = catsRepository;
        this.loggerServide = loggerServide;
    }
    async execute(input, { tracing, user }) {
        const cats = await this.catsRepository.findById(input.id);
        if (!cats) {
            throw new exception_1.ApiNotFoundException();
        }
        const entity = new cats_1.CatsEntity(Object.assign(Object.assign({}, cats), input));
        await this.catsRepository.updateOne({ id: entity.id }, entity);
        this.loggerServide.info({ message: 'cats updated.', obj: { cats: input } });
        const updated = await this.catsRepository.findById(entity.id);
        tracing.logEvent('cats-updated', `cats updated by: ${user.login}`);
        return new cats_1.CatsEntity(updated);
    }
}
exports.CatsUpdateUsecase = CatsUpdateUsecase;
__decorate([
    (0, validate_schema_decorator_1.ValidateSchema)(exports.CatsUpdateSchema),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CatsUpdateUsecase.prototype, "execute", null);
//# sourceMappingURL=cats-update.js.map