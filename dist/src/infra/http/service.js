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
exports.HttpService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const axios_better_stacktrace_1 = __importDefault(require("axios-better-stacktrace"));
const https_1 = __importDefault(require("https"));
const axios_2 = require("../../utils/axios");
const logger_1 = require("../logger");
let HttpService = class HttpService {
    constructor(loggerService) {
        this.loggerService = loggerService;
        const httpsAgent = new https_1.default.Agent({
            keepAlive: true,
            rejectUnauthorized: false
        });
        this.axios = axios_1.default.create({ proxy: false, httpsAgent });
        (0, axios_2.requestRetry)({ axios: this.axios, logger: this.loggerService });
        (0, axios_better_stacktrace_1.default)(this.axios);
        this.axios.interceptors.response.use((response) => response, (error) => {
            (0, axios_2.interceptAxiosResponseError)(error, this.loggerService);
            return Promise.reject(error);
        });
    }
    instance() {
        return this.axios;
    }
};
HttpService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logger_1.ILoggerAdapter])
], HttpService);
exports.HttpService = HttpService;
//# sourceMappingURL=service.js.map