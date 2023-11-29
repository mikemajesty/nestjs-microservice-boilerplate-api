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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const common_1 = require("@nestjs/common");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_1 = require("../../core/user/entity/user");
const secrets_1 = require("../../infra/secrets");
const exception_1 = require("../../utils/exception");
const Schema = user_1.UserEntitySchema.pick({
    login: true,
    password: true,
    roles: true
});
let TokenService = exports.TokenService = class TokenService {
    constructor(secret) {
        this.secret = secret;
    }
    sign(model, options) {
        const token = jsonwebtoken_1.default.sign(model, this.secret.JWT_SECRET_KEY, options || {
            expiresIn: this.secret.TOKEN_EXPIRATION
        });
        return { token };
    }
    async verify(token) {
        return new Promise((res, rej) => {
            jsonwebtoken_1.default.verify(token, this.secret.JWT_SECRET_KEY, (error, decoded) => {
                if (error)
                    rej(new exception_1.ApiUnauthorizedException(error.message));
                res(decoded);
            });
        });
    }
    decode(token, complete) {
        return jsonwebtoken_1.default.decode(token, { complete });
    }
};
exports.TokenService = TokenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [secrets_1.ISecretsAdapter])
], TokenService);
//# sourceMappingURL=service.js.map