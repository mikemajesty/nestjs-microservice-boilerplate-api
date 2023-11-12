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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SequelizeRepository = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = __importDefault(require("sequelize"));
const sequelize_3 = require("../../../utils/database/sequelize");
const convert_sequelize_filter_decorator_1 = require("../../../utils/decorators/database/postgres/convert-sequelize-filter.decorator");
const exception_1 = require("../../../utils/exception");
const util_1 = require("../util");
class SequelizeRepository {
    constructor(Model) {
        this.Model = Model;
    }
    async findByCommands(filterList, options) {
        const { schema } = sequelize_3.DatabaseOptionsSchema.parse(options);
        const postgresSearch = {
            equal: { type: sequelize_1.Op.in, like: false },
            not_equal: { type: sequelize_1.Op.notIn, like: false },
            not_contains: { type: sequelize_1.Op.notILike, like: true },
            contains: { type: sequelize_1.Op.iLike, like: true }
        };
        const searchList = {};
        (0, util_1.validateFindByCommandsFilter)(filterList);
        for (const filter of filterList) {
            const command = postgresSearch[filter.command];
            if (command.like) {
                Object.assign(searchList, {
                    [filter.property]: { [command.type]: { [sequelize_1.Op.any]: filter.value.map((v) => `%${v}%`) } }
                });
                continue;
            }
            Object.assign(searchList, { [filter.property]: { [command.type]: filter.value } });
        }
        Object.assign(searchList, { deletedAt: null });
        const model = await this.Model.schema(schema).findAll({
            where: searchList
        });
        return model.map((m) => m.toJSON());
    }
    async createOrUpdate(document, options) {
        const { schema, transaction } = sequelize_3.DatabaseOptionsSchema.parse(options);
        if (!document['id']) {
            throw new exception_1.ApiBadRequestException('id is required');
        }
        const exists = await this.findById(document['id'], options);
        if (!exists) {
            const savedDoc = await this.Model.schema(schema).create(document, {
                transaction
            });
            const model = await savedDoc.save();
            return { id: model.id, created: true, updated: false };
        }
        await this.Model.schema(schema).update(document, {
            where: { id: exists.id },
            transaction
        });
        return { id: exists.id, created: false, updated: true };
    }
    async findAll(filter, options) {
        const { schema } = sequelize_3.DatabaseOptionsSchema.parse(options);
        const model = await this.Model.schema(schema).findAll({
            where: filter
        });
        return model.map((m) => m.toJSON());
    }
    async find(filter, options) {
        const { schema } = sequelize_3.DatabaseOptionsSchema.parse(options);
        const model = await this.Model.schema(schema).findAll({
            where: filter
        });
        return model.map((m) => m.toJSON());
    }
    async findIn(filter, options) {
        const { schema } = sequelize_3.DatabaseOptionsSchema.parse(options);
        const key = Object.keys(filter)[0];
        const model = await this.Model.schema(schema).findAll({
            where: { [key]: { [sequelize_2.default.Op.in]: filter[`${key}`] } }
        });
        return model.map((m) => m.toJSON());
    }
    async remove(filter, options) {
        const { schema, transaction } = sequelize_3.DatabaseOptionsSchema.parse(options);
        const model = await this.Model.schema(schema).destroy({
            where: filter,
            transaction
        });
        return { deletedCount: model, deleted: !!model };
    }
    async findOne(filter, options) {
        const { schema } = sequelize_3.DatabaseOptionsSchema.parse(options);
        const model = await this.Model.schema(schema).findOne({
            where: filter
        });
        if (!model)
            return;
        return model.toJSON();
    }
    async updateOne(filter, updated, options) {
        const { schema, transaction } = sequelize_3.DatabaseOptionsSchema.parse(options);
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
        const { schema, transaction } = sequelize_3.DatabaseOptionsSchema.parse(options);
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
        const { schema } = sequelize_3.DatabaseOptionsSchema.parse(options);
        for (const model of entityList) {
            const data = await this.findById(model.id, { schema });
            if (!data) {
                await this.create(model, { schema: schema });
            }
        }
    }
    async create(document, saveOptions) {
        const { schema, transaction } = sequelize_3.DatabaseOptionsSchema.parse(saveOptions);
        const savedDoc = await this.Model.schema(schema).create(document, {
            transaction
        });
        const model = await savedDoc.save();
        return { id: model.id, created: !!model.id };
    }
    async insertMany(documents, saveOptions) {
        const { schema, transaction } = sequelize_3.DatabaseOptionsSchema.parse(saveOptions);
        await this.Model.schema(schema).bulkCreate(documents, {
            transaction
        });
    }
    async findOneWithExcludeFields(filter, excludeProperties, options) {
        const { schema } = sequelize_3.DatabaseOptionsSchema.parse(options);
        const exclude = excludeProperties.map((e) => `${e.toString()}`);
        const model = await this.Model.schema(schema).findOne({
            where: filter,
            attributes: { exclude }
        });
        if (!model)
            return;
        return model.toJSON();
    }
    async findAllWithExcludeFields(includeProperties, filter, options) {
        const { schema } = sequelize_3.DatabaseOptionsSchema.parse(options);
        const exclude = includeProperties.map((e) => `${e.toString()}`);
        if (!filter) {
            filter = { deletedAt: null };
        }
        const model = await this.Model.schema(schema).findAll({
            where: filter,
            attributes: { exclude }
        });
        return model.map((m) => m.toJSON());
    }
    async findOneWithSelectFields(filter, includeProperties, options) {
        const { schema } = sequelize_3.DatabaseOptionsSchema.parse(options);
        const include = includeProperties.map((e) => `${e.toString()}`);
        const model = await this.Model.schema(schema).findOne({
            where: filter,
            attributes: include
        });
        if (!model)
            return;
        return model.toJSON();
    }
    async findAllWithSelectFields(includeProperties, filter, options) {
        const { schema } = sequelize_3.DatabaseOptionsSchema.parse(options);
        const include = includeProperties.map((e) => `${e.toString()}`);
        if (!filter) {
            filter = { deletedAt: null };
        }
        const model = await this.Model.schema(schema).findAll({
            where: filter,
            attributes: include
        });
        return model.map((m) => m.toJSON());
    }
    async findById(id, options) {
        const { schema } = sequelize_3.DatabaseOptionsSchema.parse(options);
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
__decorate([
    (0, convert_sequelize_filter_decorator_1.ConvertSequelizeFilterToRepository)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_q = typeof TQuery !== "undefined" && TQuery) === "function" ? _q : Object, Array, typeof (_r = typeof TOptions !== "undefined" && TOptions) === "function" ? _r : Object]),
    __metadata("design:returntype", Promise)
], SequelizeRepository.prototype, "findOneWithExcludeFields", null);
__decorate([
    (0, convert_sequelize_filter_decorator_1.ConvertSequelizeFilterToRepository)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_s = typeof TQuery !== "undefined" && TQuery) === "function" ? _s : Object, Array, typeof (_t = typeof TOptions !== "undefined" && TOptions) === "function" ? _t : Object]),
    __metadata("design:returntype", Promise)
], SequelizeRepository.prototype, "findOneWithSelectFields", null);
exports.SequelizeRepository = SequelizeRepository;
//# sourceMappingURL=repository.js.map