"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CatsSchema", {
    enumerable: true,
    get: function() {
        return CatsSchema;
    }
});
const _sequelizetypescript = require("sequelize-typescript");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let CatsSchema = class CatsSchema extends _sequelizetypescript.Model {
};
_ts_decorate([
    (0, _sequelizetypescript.Column)({
        primaryKey: true,
        type: _sequelizetypescript.DataType.UUID
    }),
    _ts_metadata("design:type", String)
], CatsSchema.prototype, "id", void 0);
_ts_decorate([
    (0, _sequelizetypescript.Column)(_sequelizetypescript.DataType.STRING),
    _ts_metadata("design:type", String)
], CatsSchema.prototype, "name", void 0);
_ts_decorate([
    (0, _sequelizetypescript.Column)(_sequelizetypescript.DataType.INTEGER),
    _ts_metadata("design:type", Number)
], CatsSchema.prototype, "age", void 0);
_ts_decorate([
    (0, _sequelizetypescript.Column)(_sequelizetypescript.DataType.STRING),
    _ts_metadata("design:type", String)
], CatsSchema.prototype, "breed", void 0);
_ts_decorate([
    (0, _sequelizetypescript.Column)({
        allowNull: true,
        type: _sequelizetypescript.DataType.DATE
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], CatsSchema.prototype, "deletedAt", void 0);
CatsSchema = _ts_decorate([
    (0, _sequelizetypescript.Table)({
        timestamps: true,
        tableName: 'cats'
    })
], CatsSchema);

//# sourceMappingURL=cats.js.map