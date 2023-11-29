"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "HttpService", {
    enumerable: true,
    get: function() {
        return HttpService;
    }
});
const _common = require("@nestjs/common");
const _axios = /*#__PURE__*/ _interop_require_default(require("axios"));
const _axiosbetterstacktrace = /*#__PURE__*/ _interop_require_default(require("axios-better-stacktrace"));
const _https = /*#__PURE__*/ _interop_require_default(require("https"));
const _axios1 = require("../../utils/axios");
const _logger = require("../logger");
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
let HttpService = class HttpService {
    instance() {
        return this.axios;
    }
    constructor(loggerService){
        this.loggerService = loggerService;
        const httpsAgent = new _https.default.Agent({
            keepAlive: true,
            rejectUnauthorized: false
        });
        this.axios = _axios.default.create({
            proxy: false,
            httpsAgent
        });
        (0, _axios1.requestRetry)({
            axios: this.axios,
            logger: this.loggerService
        });
        (0, _axiosbetterstacktrace.default)(this.axios);
        this.axios.interceptors.response.use((response)=>response, (error)=>{
            (0, _axios1.interceptAxiosResponseError)(error, this.loggerService);
            return Promise.reject(error);
        });
    }
};
HttpService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _logger.ILoggerAdapter === "undefined" ? Object : _logger.ILoggerAdapter
    ])
], HttpService);

//# sourceMappingURL=service.js.map