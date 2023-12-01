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
    LogoutSchema: function() {
        return LogoutSchema;
    },
    LogoutUsecase: function() {
        return LogoutUsecase;
    }
});
const _zod = require("zod");
const _validateschemadecorator = require("../../../utils/decorators/validate-schema.decorator");
const _request = require("../../../utils/request");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
const LogoutSchema = _zod.z.object({
    token: _zod.z.string().trim().min(10)
});
let LogoutUsecase = class LogoutUsecase {
    async execute(input, { tracing, user }) {
        await this.redis.set(input.token, input.token, {
            PX: this.secretes.TOKEN_EXPIRATION
        });
        tracing.logEvent('user-logout', `${user.login}`);
    }
    constructor(redis, secretes){
        this.redis = redis;
        this.secretes = secretes;
    }
};
_ts_decorate([
    (0, _validateschemadecorator.ValidateSchema)(LogoutSchema),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof LogoutInput === "undefined" ? Object : LogoutInput,
        typeof _request.ApiTrancingInput === "undefined" ? Object : _request.ApiTrancingInput
    ])
], LogoutUsecase.prototype, "execute", null);

//# sourceMappingURL=user-logout.js.map