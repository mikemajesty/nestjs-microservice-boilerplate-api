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
exports.MongoRepository = void 0;
const convert_mongoose_filter_decorator_1 = require("../../../utils/decorators/database/mongo/convert-mongoose-filter.decorator");
const exception_1 = require("../../../utils/exception");
class MongoRepository {
    constructor(model) {
        this.model = model;
    }
    async insertMany(documents, saveOptions) {
        await this.model.insertMany(documents, saveOptions);
    }
    async create(document, saveOptions) {
        const createdEntity = new this.model(Object.assign(Object.assign({}, document), { _id: document.id }));
        const savedResult = await createdEntity.save(saveOptions);
        return { id: savedResult.id, created: !!savedResult.id };
    }
    async find(filter, options) {
        return (await this.model.find(filter, undefined, options)).map((u) => u.toObject({ virtuals: true }));
    }
    async findById(id) {
        const model = await this.model.findById(id);
        if (!model)
            return null;
        return model.toObject({ virtuals: true });
    }
    async findOne(filter, options) {
        const data = await this.model.findOne(filter, undefined, options);
        if (!data)
            return null;
        return data.toObject({ virtuals: true });
    }
    async findAll(filter) {
        const modelList = await this.model.find(filter);
        return (modelList || []).map((u) => u.toObject({ virtuals: true }));
    }
    async remove(filter) {
        const { deletedCount } = await this.model.deleteOne(filter);
        return { deletedCount, deleted: !!deletedCount };
    }
    async updateOne(filter, updated, options) {
        return await this.model.updateOne(filter, updated, options);
    }
    async updateMany(filter, updated, options) {
        return await this.model.updateMany(filter, updated, options);
    }
    async findIn(input) {
        const key = Object.keys(input)[0];
        const filter = { [key]: { $in: input[key === 'id' ? '_id' : key] }, deletedAt: null };
        return await this.model.find(filter);
    }
    async seed(entityList) {
        const allHasId = entityList.some((e) => !e.id);
        if (allHasId) {
            throw new exception_1.ApiInternalServerException('seed id is required');
        }
        for (const model of entityList) {
            const data = await this.findById(model.id);
            if (!data) {
                await this.create(model);
            }
        }
    }
}
__decorate([
    (0, convert_mongoose_filter_decorator_1.ConvertMongoFilterToBaseRepository)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MongoRepository.prototype, "find", null);
__decorate([
    (0, convert_mongoose_filter_decorator_1.ConvertMongoFilterToBaseRepository)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MongoRepository.prototype, "findOne", null);
__decorate([
    (0, convert_mongoose_filter_decorator_1.ConvertMongoFilterToBaseRepository)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MongoRepository.prototype, "findAll", null);
__decorate([
    (0, convert_mongoose_filter_decorator_1.ConvertMongoFilterToBaseRepository)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MongoRepository.prototype, "remove", null);
__decorate([
    (0, convert_mongoose_filter_decorator_1.ConvertMongoFilterToBaseRepository)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], MongoRepository.prototype, "updateOne", null);
__decorate([
    (0, convert_mongoose_filter_decorator_1.ConvertMongoFilterToBaseRepository)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], MongoRepository.prototype, "updateMany", null);
exports.MongoRepository = MongoRepository;
//# sourceMappingURL=repository.js.map