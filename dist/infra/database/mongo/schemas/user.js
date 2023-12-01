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
    User: function() {
        return User;
    },
    UserSchema: function() {
        return UserSchema;
    }
});
const _mongoose = require("@nestjs/mongoose");
const _mongoosepaginatev2 = /*#__PURE__*/ _interop_require_default(require("mongoose-paginate-v2"));
const _user = require("../../../../core/user/entity/user");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
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
let User = class User {
};
_ts_decorate([
    (0, _mongoose.Prop)({
        type: String
    }),
    _ts_metadata("design:type", String)
], User.prototype, "_id", void 0);
_ts_decorate([
    (0, _mongoose.Prop)({
        min: 0,
        max: 200,
        required: true,
        type: String
    }),
    _ts_metadata("design:type", String)
], User.prototype, "login", void 0);
_ts_decorate([
    (0, _mongoose.Prop)({
        min: 0,
        max: 200,
        required: true,
        type: String
    }),
    _ts_metadata("design:type", String)
], User.prototype, "password", void 0);
_ts_decorate([
    (0, _mongoose.Prop)({
        enum: _user.UserRole,
        type: Array,
        required: true
    }),
    _ts_metadata("design:type", Array)
], User.prototype, "roles", void 0);
_ts_decorate([
    (0, _mongoose.Prop)({
        type: Date,
        default: null
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], User.prototype, "deletedAt", void 0);
User = _ts_decorate([
    (0, _mongoose.Schema)({
        collection: 'user-collection',
        autoIndex: true,
        timestamps: true
    })
], User);
const UserSchema = _mongoose.SchemaFactory.createForClass(User);
UserSchema.index({
    login: 1
}, {
    unique: true,
    partialFilterExpression: {
        deletedAt: {
            $eq: null
        }
    }
});
UserSchema.plugin(_mongoosepaginatev2.default);
UserSchema.virtual('id').get(function() {
    return this._id;
});

//# sourceMappingURL=user.js.map