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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsInterceptor = void 0;
const common_1 = require("@nestjs/common");
const api_1 = require("@opentelemetry/api");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const luxon_1 = require("luxon");
const package_json_1 = require("../../../package.json");
const rxjs_1 = require("rxjs");
let MetricsInterceptor = class MetricsInterceptor {
    constructor() {
        this.metrics = api_1.default.metrics.getMeter(package_json_1.name, package_json_1.version);
        this.counter = this.metrics.createCounter(`api_requests`, { description: 'Request Counter', unit: 'ms' });
        this.histogram = this.metrics.createHistogram('api_histogram', { description: 'Request Time' });
    }
    intercept(executionContext, next) {
        const request = executionContext.switchToHttp().getRequest();
        const res = executionContext.switchToHttp().getResponse();
        const startTime = luxon_1.DateTime.now().setZone(process.env.TZ).toUTC().toJSDate().getTime();
        this.counter.add(1, {
            [semantic_conventions_1.SemanticAttributes.HTTP_URL]: request.url,
            [semantic_conventions_1.SemanticAttributes.HTTP_METHOD]: request.method
        });
        return next.handle().pipe((0, rxjs_1.tap)(() => {
            const endTime = luxon_1.DateTime.now().setZone(process.env.TZ).toUTC().toJSDate().getTime();
            const executionTime = endTime - startTime;
            this.histogram.record(executionTime, {
                [semantic_conventions_1.SemanticAttributes.HTTP_URL]: request.url,
                [semantic_conventions_1.SemanticAttributes.HTTP_METHOD]: request.method,
                [semantic_conventions_1.SemanticAttributes.HTTP_STATUS_CODE]: res.statusCode
            });
        }));
    }
};
MetricsInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], MetricsInterceptor);
exports.MetricsInterceptor = MetricsInterceptor;
//# sourceMappingURL=metrics.interceptor.js.map