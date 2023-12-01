"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TokenService", {
    enumerable: true,
    get: function() {
        return TokenService;
    }
});
const _common = require("@nestjs/common");
const _jsonwebtoken = /*#__PURE__*/ _interop_require_default(require("jsonwebtoken"));
const _user = require("../../core/user/entity/user");
const _secrets = require("../../infra/secrets");
const _exception = require("../../utils/exception");
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
const Schema = _user.UserEntitySchema.pick({
    login: true,
    password: true,
    roles: true
});
let TokenService = class TokenService {
    sign(model, options) {
        const token = _jsonwebtoken.default.sign(model, this.secret.JWT_SECRET_KEY, options || {
            expiresIn: this.secret.TOKEN_EXPIRATION
        });
        return {
            token
        };
    }
    async verify(token) {
        return new Promise((res, rej)=>{
            _jsonwebtoken.default.verify(token, this.secret.JWT_SECRET_KEY, (error, decoded)=>{
                if (error) rej(new _exception.ApiUnauthorizedException(error.message));
                res(decoded);
            });
        });
    }
    decode(token, complete) {
        return _jsonwebtoken.default.decode(token, {
            complete
        });
    }
    constructor(secret){
        this.secret = secret;
    }
};
TokenService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _secrets.ISecretsAdapter === "undefined" ? Object : _secrets.ISecretsAdapter
    ])
], TokenService);

//# sourceMappingURL=service.js.map