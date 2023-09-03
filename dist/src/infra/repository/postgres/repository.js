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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SequelizeRepository = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../../../utils/database/sequelize");
const convert_sequelize_filter_decorator_1 = require("../../../utils/decorators/database/postgres/convert-sequelize-filter.decorator");
class SequelizeRepository {
    constructor(Model) {
        this.Model = Model;
    }
    async findAll(filter, options) {
        const { schema } = sequelize_2.DatabaseOptionsSchema.parse(options);
        const model = await this.Model.schema(schema).findAll({
            where: filter
        });
        return (model || []).map((m) => m.toJSON());
    }
    async find(filter, options) {
        const { schema } = sequelize_2.DatabaseOptionsSchema.parse(options);
        const model = await this.Model.schema(schema).findAll({
            where: filter
        });
        return (model || []).map((m) => m.toJSON());
    }
    async findIn(filter, options) {
        const { schema } = sequelize_2.DatabaseOptionsSchema.parse(options);
        const key = Object.keys(filter)[0];
        const model = await this.Model.schema(schema).findAll({
            where: { [key]: { [sequelize_1.default.Op.in]: filter[key] } }
        });
        return (model || []).map((m) => m.toJSON());
    }
    async remove(filter, options) {
        const { schema, transaction } = sequelize_2.DatabaseOptionsSchema.parse(options);
        const model = await this.Model.schema(schema).destroy({
            where: filter,
            transaction
        });
        return { deletedCount: model, deleted: !!model };
    }
    async findOne(filter, options) {
        const { schema } = sequelize_2.DatabaseOptionsSchema.parse(options);
        const model = await this.Model.schema(schema).findOne({
            where: filter
        });
        if (!model)
            return;
        return model.toJSON();
    }
    async updateOne(filter, updated, options) {
        const { schema, transaction } = sequelize_2.DatabaseOptionsSchema.parse(options);
        const model = await this.Model.schema(schema).update(updated, {
            where: filter,
            transaction
        });
        return {
            modifiedCount: model.length,
            matchedCount: model.length,
            acknowledged: null,
            upsertedCount: model.length,
            upsertedId: null
        };
    }
    async updateMany(filter, updated, options) {
        const { schema, transaction } = sequelize_2.DatabaseOptionsSchema.parse(options);
        const model = await this.Model.schema(schema).update(updated, {
            where: filter,
            transaction
        });
        return {
            modifiedCount: model.length,
            matchedCount: model.length,
            acknowledged: null,
            upsertedCount: model.length,
            upsertedId: null
        };
    }
    async seed(entityList, options) {
        const { schema } = sequelize_2.DatabaseOptionsSchema.parse(options);
        for (const model of entityList) {
            const data = await this.findById(model.id, { schema });
            if (!data) {
                await this.create(model, { schema: schema });
            }
        }
    }
    async create(document, saveOptions) {
        const { schema, transaction } = sequelize_2.DatabaseOptionsSchema.parse(saveOptions);
        const savedDoc = await this.Model.schema(schema).create(document, {
            transaction
        });
        const model = await savedDoc.save();
        return { id: model.id, created: !!model.id };
    }
    async insertMany(documents, saveOptions) {
        const { schema, transaction } = sequelize_2.DatabaseOptionsSchema.parse(saveOptions);
        await this.Model.schema(schema).bulkCreate(documents, {
            transaction
        });
    }
    async findById(id, options) {
        const { schema } = sequelize_2.DatabaseOptionsSchema.parse(options);
        const model = await this.Model.schema(schema).findOne({ where: { id, deletedAt: null } });
        if (!model)
            return;
        return model.toJSON();
    }
}
__decorate([
    (0, convert_sequelize_filter_decorator_1.ConvertSequelizeFilterToRepository)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof TQuery !== "undefined" && TQuery) === "function" ? _a : Object, typeof (_b = typeof TOpt !== "undefined" && TOpt) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], SequelizeRepository.prototype, "findAll", null);
__decorate([
    (0, convert_sequelize_filter_decorator_1.ConvertSequelizeFilterToRepository)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof TQuery !== "undefined" && TQuery) === "function" ? _c : Object, typeof (_d = typeof TOptions !== "undefined" && TOptions) === "function" ? _d : Object]),
    __metadata("design:returntype", Promise)
], SequelizeRepository.prototype, "find", null);
__decorate([
    (0, convert_sequelize_filter_decorator_1.ConvertSequelizeFilterToRepository)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_e = typeof TQuery !== "undefined" && TQuery) === "function" ? _e : Object, typeof (_f = typeof TOpt !== "undefined" && TOpt) === "function" ? _f : Object]),
    __metadata("design:returntype", Promise)
], SequelizeRepository.prototype, "remove", null);
__decorate([
    (0, convert_sequelize_filter_decorator_1.ConvertSequelizeFilterToRepository)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_g = typeof TQuery !== "undefined" && TQuery) === "function" ? _g : Object, typeof (_h = typeof TOptions !== "undefined" && TOptions) === "function" ? _h : Object]),
    __metadata("design:returntype", Promise)
], SequelizeRepository.prototype, "findOne", null);
__decorate([
    (0, convert_sequelize_filter_decorator_1.ConvertSequelizeFilterToRepository)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_j = typeof TQuery !== "undefined" && TQuery) === "function" ? _j : Object, typeof (_k = typeof TUpdate !== "undefined" && TUpdate) === "function" ? _k : Object, typeof (_l = typeof TOptions !== "undefined" && TOptions) === "function" ? _l : Object]),
    __metadata("design:returntype", Promise)
], SequelizeRepository.prototype, "updateOne", null);
__decorate([
    (0, convert_sequelize_filter_decorator_1.ConvertSequelizeFilterToRepository)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_m = typeof TQuery !== "undefined" && TQuery) === "function" ? _m : Object, typeof (_o = typeof TUpdate !== "undefined" && TUpdate) === "function" ? _o : Object, typeof (_p = typeof TOptions !== "undefined" && TOptions) === "function" ? _p : Object]),
    __metadata("design:returntype", Promise)
], SequelizeRepository.prototype, "updateMany", null);
exports.SequelizeRepository = SequelizeRepository;
//# sourceMappingURL=repository.js.map