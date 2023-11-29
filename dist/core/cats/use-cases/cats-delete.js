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
    CatsDeleteSchema: function() {
        return CatsDeleteSchema;
    },
    CatsDeleteUsecase: function() {
        return CatsDeleteUsecase;
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
const CatsDeleteSchema = _cats.CatsEntitySchema.pick({
    id: true
});
let CatsDeleteUsecase = class CatsDeleteUsecase {
    async execute({ id }, { tracing, user }) {
        const model = await this.catsRepository.findById(id);
        if (!model) {
            throw new _exception.ApiNotFoundException();
        }
        const cats = new _cats.CatsEntity(model);
        cats.setDeleted();
        await this.catsRepository.updateOne({
            id: cats.id
        }, cats);
        tracing.logEvent('cats-deleted', `cats deleted by: ${user.login}`);
        return cats;
    }
    constructor(catsRepository){
        this.catsRepository = catsRepository;
    }
};
_ts_decorate([
    (0, _validateschemadecorator.ValidateSchema)(CatsDeleteSchema),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof CatsDeleteInput === "undefined" ? Object : CatsDeleteInput,
        typeof _request.ApiTrancingInput === "undefined" ? Object : _request.ApiTrancingInput
    ])
], CatsDeleteUsecase.prototype, "execute", null);

//# sourceMappingURL=cats-delete.js.map