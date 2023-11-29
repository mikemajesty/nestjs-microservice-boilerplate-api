"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SequelizeRepository", {
    enumerable: true,
    get: function() {
        return SequelizeRepository;
    }
});
const _sequelize = /*#__PURE__*/ _interop_require_wildcard(require("sequelize"));
const _sequelize1 = require("../../../utils/database/sequelize");
const _convertsequelizefilterdecorator = require("../../../utils/decorators/database/postgres/convert-sequelize-filter.decorator");
const _exception = require("../../../utils/exception");
const _util = require("../util");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let SequelizeRepository = class SequelizeRepository {
    async findByCommands(filterList, options) {
        const { schema } = _sequelize1.DatabaseOptionsSchema.parse(options);
        const postgresSearch = {
            equal: {
                type: _sequelize.Op.in,
                like: false
            },
            not_equal: {
                type: _sequelize.Op.notIn,
                like: false
            },
            not_contains: {
                type: _sequelize.Op.notILike,
                like: true
            },
            contains: {
                type: _sequelize.Op.iLike,
                like: true
            }
        };
        const searchList = {};
        (0, _util.validateFindByCommandsFilter)(filterList);
        for (const filter of filterList){
            const command = postgresSearch[filter.command];
            if (command.like) {
                Object.assign(searchList, {
                    [filter.property]: {
                        [command.type]: {
                            [_sequelize.Op.any]: filter.value.map((v)=>`%${v}%`)
                        }
                    }
                });
                continue;
            }
            Object.assign(searchList, {
                [filter.property]: {
                    [command.type]: filter.value
                }
            });
        }
        Object.assign(searchList, {
            deletedAt: null
        });
        const model = await this.Model.schema(schema).findAll({
            where: searchList
        });
        return model.map((m)=>m.toJSON());
    }
    async createOrUpdate(document, options) {
        const { schema, transaction } = _sequelize1.DatabaseOptionsSchema.parse(options);
        if (!document['id']) {
            throw new _exception.ApiBadRequestException('id is required');
        }
        const exists = await this.findById(document['id'], options);
        if (!exists) {
            const savedDoc = await this.Model.schema(schema).create(document, {
                transaction
            });
            const model = await savedDoc.save();
            return {
                id: model.id,
                created: true,
                updated: false
            };
        }
        await this.Model.schema(schema).update(document, {
            where: {
                id: exists.id
            },
            transaction
        });
        return {
            id: exists.id,
            created: false,
            updated: true
        };
    }
    async findAll(filter, options) {
        const { schema } = _sequelize1.DatabaseOptionsSchema.parse(options);
        const model = await this.Model.schema(schema).findAll({
            where: filter
        });
        return model.map((m)=>m.toJSON());
    }
    async find(filter, options) {
        const { schema } = _sequelize1.DatabaseOptionsSchema.parse(options);
        const model = await this.Model.schema(schema).findAll({
            where: filter
        });
        return model.map((m)=>m.toJSON());
    }
    async findIn(filter, options) {
        const { schema } = _sequelize1.DatabaseOptionsSchema.parse(options);
        const key = Object.keys(filter)[0];
        const model = await this.Model.schema(schema).findAll({
            where: {
                [key]: {
                    [_sequelize.default.Op.in]: filter[`${key}`]
                }
            }
        });
        return model.map((m)=>m.toJSON());
    }
    async remove(filter, options) {
        const { schema, transaction } = _sequelize1.DatabaseOptionsSchema.parse(options);
        const model = await this.Model.schema(schema).destroy({
            where: filter,
            transaction
        });
        return {
            deletedCount: model,
            deleted: !!model
        };
    }
    async findOne(filter, options) {
        const { schema } = _sequelize1.DatabaseOptionsSchema.parse(options);
        const model = await this.Model.schema(schema).findOne({
            where: filter
        });
        if (!model) return;
        return model.toJSON();
    }
    async findOneAndUpdate(filter, updated, options) {
        const { schema, transaction } = _sequelize1.DatabaseOptionsSchema.parse(options);
        const [rowsEffected] = await this.Model.schema(schema).update(updated, {
            where: filter,
            transaction
        });
        if (!rowsEffected) {
            return null;
        }
        const model = await this.Model.schema(schema).findOne({
            where: filter
        });
        return model.toJSON();
    }
    async updateOne(filter, updated, options) {
        const { schema, transaction } = _sequelize1.DatabaseOptionsSchema.parse(options);
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
        const { schema, transaction } = _sequelize1.DatabaseOptionsSchema.parse(options);
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
        const { schema } = _sequelize1.DatabaseOptionsSchema.parse(options);
        for (const model of entityList){
            const data = await this.findById(model.id, {
                schema
            });
            if (!data) {
                await this.create(model, {
                    schema: schema
                });
            }
        }
    }
    async create(document, saveOptions) {
        const { schema, transaction } = _sequelize1.DatabaseOptionsSchema.parse(saveOptions);
        const savedDoc = await this.Model.schema(schema).create(document, {
            transaction
        });
        const model = await savedDoc.save();
        return {
            id: model.id,
            created: !!model.id
        };
    }
    async insertMany(documents, saveOptions) {
        const { schema, transaction } = _sequelize1.DatabaseOptionsSchema.parse(saveOptions);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await this.Model.schema(schema).bulkCreate(documents, {
            transaction
        });
    }
    async findOneWithExcludeFields(filter, excludeProperties, options) {
        const { schema } = _sequelize1.DatabaseOptionsSchema.parse(options);
        const exclude = excludeProperties.map((e)=>`${e.toString()}`);
        const model = await this.Model.schema(schema).findOne({
            where: filter,
            attributes: {
                exclude
            }
        });
        if (!model) return;
        return model.toJSON();
    }
    async findAllWithExcludeFields(includeProperties, filter, options) {
        const { schema } = _sequelize1.DatabaseOptionsSchema.parse(options);
        const exclude = includeProperties.map((e)=>`${e.toString()}`);
        if (!filter) {
            filter = {
                deletedAt: null
            };
        }
        const model = await this.Model.schema(schema).findAll({
            where: filter,
            attributes: {
                exclude
            }
        });
        return model.map((m)=>m.toJSON());
    }
    async findOneWithSelectFields(filter, includeProperties, options) {
        const { schema } = _sequelize1.DatabaseOptionsSchema.parse(options);
        const include = includeProperties.map((e)=>`${e.toString()}`);
        const model = await this.Model.schema(schema).findOne({
            where: filter,
            attributes: include
        });
        if (!model) return;
        return model.toJSON();
    }
    async findAllWithSelectFields(includeProperties, filter, options) {
        const { schema } = _sequelize1.DatabaseOptionsSchema.parse(options);
        const include = includeProperties.map((e)=>`${e.toString()}`);
        if (!filter) {
            filter = {
                deletedAt: null
            };
        }
        const model = await this.Model.schema(schema).findAll({
            where: filter,
            attributes: include
        });
        return model.map((m)=>m.toJSON());
    }
    async findById(id, options) {
        const { schema } = _sequelize1.DatabaseOptionsSchema.parse(options);
        const model = await this.Model.schema(schema).findOne({
            where: {
                id,
                deletedAt: null
            }
        });
        if (!model) return;
        return model.toJSON();
    }
    constructor(Model){
        this.Model = Model;
    }
};
_ts_decorate([
    (0, _convertsequelizefilterdecorator.ConvertSequelizeFilterToRepository)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof TQuery === "undefined" ? Object : TQuery,
        typeof TOpt === "undefined" ? Object : TOpt
    ])
], SequelizeRepository.prototype, "findAll", null);
_ts_decorate([
    (0, _convertsequelizefilterdecorator.ConvertSequelizeFilterToRepository)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof TQuery === "undefined" ? Object : TQuery,
        typeof TOptions === "undefined" ? Object : TOptions
    ])
], SequelizeRepository.prototype, "find", null);
_ts_decorate([
    (0, _convertsequelizefilterdecorator.ConvertSequelizeFilterToRepository)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof TQuery === "undefined" ? Object : TQuery,
        typeof TOpt === "undefined" ? Object : TOpt
    ])
], SequelizeRepository.prototype, "remove", null);
_ts_decorate([
    (0, _convertsequelizefilterdecorator.ConvertSequelizeFilterToRepository)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof TQuery === "undefined" ? Object : TQuery,
        typeof TOptions === "undefined" ? Object : TOptions
    ])
], SequelizeRepository.prototype, "findOne", null);
_ts_decorate([
    (0, _convertsequelizefilterdecorator.ConvertSequelizeFilterToRepository)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof TQuery === "undefined" ? Object : TQuery,
        typeof TUpdate === "undefined" ? Object : TUpdate,
        typeof TOptions === "undefined" ? Object : TOptions
    ])
], SequelizeRepository.prototype, "findOneAndUpdate", null);
_ts_decorate([
    (0, _convertsequelizefilterdecorator.ConvertSequelizeFilterToRepository)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof TQuery === "undefined" ? Object : TQuery,
        typeof TUpdate === "undefined" ? Object : TUpdate,
        typeof TOptions === "undefined" ? Object : TOptions
    ])
], SequelizeRepository.prototype, "updateOne", null);
_ts_decorate([
    (0, _convertsequelizefilterdecorator.ConvertSequelizeFilterToRepository)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof TQuery === "undefined" ? Object : TQuery,
        typeof TUpdate === "undefined" ? Object : TUpdate,
        typeof TOptions === "undefined" ? Object : TOptions
    ])
], SequelizeRepository.prototype, "updateMany", null);
_ts_decorate([
    (0, _convertsequelizefilterdecorator.ConvertSequelizeFilterToRepository)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof TQuery === "undefined" ? Object : TQuery,
        Array,
        typeof TOptions === "undefined" ? Object : TOptions
    ])
], SequelizeRepository.prototype, "findOneWithExcludeFields", null);
_ts_decorate([
    (0, _convertsequelizefilterdecorator.ConvertSequelizeFilterToRepository)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof TQuery === "undefined" ? Object : TQuery,
        Array,
        typeof TOptions === "undefined" ? Object : TOptions
    ])
], SequelizeRepository.prototype, "findOneWithSelectFields", null);

//# sourceMappingURL=repository.js.map