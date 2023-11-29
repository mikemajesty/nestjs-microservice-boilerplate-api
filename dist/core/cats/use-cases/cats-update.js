"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    CatsUpdateSchema: function() {
        return CatsUpdateSchema;
    },
    CatsUpdateUsecase: function() {
        return CatsUpdateUsecase;
    }
});
const _validateschemadecorator = require("../../../utils/decorators/validate-schema.decorator");
const _exception = require("../../../utils/exception");
const _request = require("../../../utils/request");
const _cats = require("../entity/cats");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
const CatsUpdateSchema = _cats.CatsEntitySchema.pick({
    id: true
}).merge(_cats.CatsEntitySchema.omit({
    id: true
}).partial());
let CatsUpdateUsecase = class CatsUpdateUsecase {
    async execute(input, { tracing, user }) {
        const cats = await this.catsRepository.findById(input.id);
        if (!cats) {
            throw new _exception.ApiNotFoundException();
        }
        const entity = new _cats.CatsEntity({
            ...cats,
            ...input
        });
        await this.catsRepository.updateOne({
            id: entity.id
        }, entity);
        this.loggerServide.info({
            message: 'cats updated.',
            obj: {
                cats: input
            }
        });
        const updated = await this.catsRepository.findById(entity.id);
        tracing.logEvent('cats-updated', `cats updated by: ${user.login}`);
        return new _cats.CatsEntity(updated);
    }
    constructor(catsRepository, loggerServide){
        this.catsRepository = catsRepository;
        this.loggerServide = loggerServide;
    }
};
_ts_decorate([
    (0, _validateschemadecorator.ValidateSchema)(CatsUpdateSchema),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof CatsUpdateInput === "undefined" ? Object : CatsUpdateInput,
        typeof _request.ApiTrancingInput === "undefined" ? Object : _request.ApiTrancingInput
    ])
], CatsUpdateUsecase.prototype, "execute", null);

//# sourceMappingURL=cats-update.js.map