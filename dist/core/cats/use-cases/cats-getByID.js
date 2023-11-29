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
    CatsGetByIdSchema: function() {
        return CatsGetByIdSchema;
    },
    CatsGetByIdUsecase: function() {
        return CatsGetByIdUsecase;
    }
});
const _cats = require("../entity/cats");
const _validateschemadecorator = require("../../../utils/decorators/validate-schema.decorator");
const _exception = require("../../../utils/exception");
const _cats1 = require("../entity/cats");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
const CatsGetByIdSchema = _cats.CatsEntitySchema.pick({
    id: true
});
let CatsGetByIdUsecase = class CatsGetByIdUsecase {
    async execute({ id }) {
        const cats = await this.catsRepository.findById(id);
        if (!cats) {
            throw new _exception.ApiNotFoundException();
        }
        return new _cats1.CatsEntity(cats);
    }
    constructor(catsRepository){
        this.catsRepository = catsRepository;
    }
};
_ts_decorate([
    (0, _validateschemadecorator.ValidateSchema)(CatsGetByIdSchema),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof CatsGetByIDInput === "undefined" ? Object : CatsGetByIDInput
    ])
], CatsGetByIdUsecase.prototype, "execute", null);

//# sourceMappingURL=cats-getByID.js.map