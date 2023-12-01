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
    CatsCreateSchema: function() {
        return CatsCreateSchema;
    },
    CatsCreateUsecase: function() {
        return CatsCreateUsecase;
    }
});
const _validateschemadecorator = require("../../../utils/decorators/validate-schema.decorator");
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
const CatsCreateSchema = _cats.CatsEntitySchema.pick({
    name: true,
    breed: true,
    age: true
});
let CatsCreateUsecase = class CatsCreateUsecase {
    async execute(input, { tracing, user }) {
        const entity = new _cats.CatsEntity(input);
        const transaction = await this.catsRepository.startSession();
        try {
            const cats = await this.catsRepository.create(entity, {
                transaction
            });
            await transaction.commit();
            tracing.logEvent('cats-created', `cats created by: ${user.login}`);
            return cats;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    constructor(catsRepository){
        this.catsRepository = catsRepository;
    }
};
_ts_decorate([
    (0, _validateschemadecorator.ValidateSchema)(CatsCreateSchema),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof CatsCreateInput === "undefined" ? Object : CatsCreateInput,
        typeof _request.ApiTrancingInput === "undefined" ? Object : _request.ApiTrancingInput
    ])
], CatsCreateUsecase.prototype, "execute", null);

//# sourceMappingURL=cats-create.js.map