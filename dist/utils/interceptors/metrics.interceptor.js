"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "MetricsInterceptor", {
    enumerable: true,
    get: function() {
        return MetricsInterceptor;
    }
});
const _common = require("@nestjs/common");
const _api = /*#__PURE__*/ _interop_require_default(require("@opentelemetry/api"));
const _semanticconventions = require("@opentelemetry/semantic-conventions");
const _packagejson = require("package.json");
const _rxjs = require("rxjs");
const _date = require("../date");
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
let MetricsInterceptor = class MetricsInterceptor {
    intercept(executionContext, next) {
        const request = executionContext.switchToHttp().getRequest();
        const res = executionContext.switchToHttp().getResponse();
        const startTime = _date.DateUtils.getJSDate().getTime();
        this.counter.add(1, {
            [_semanticconventions.SemanticAttributes.HTTP_URL]: request.url,
            [_semanticconventions.SemanticAttributes.HTTP_METHOD]: request.method
        });
        return next.handle().pipe((0, _rxjs.tap)(()=>{
            const endTime = _date.DateUtils.getJSDate().getTime();
            const executionTime = endTime - startTime;
            this.histogram.record(executionTime, {
                [_semanticconventions.SemanticAttributes.HTTP_URL]: request.url,
                [_semanticconventions.SemanticAttributes.HTTP_METHOD]: request.method,
                [_semanticconventions.SemanticAttributes.HTTP_STATUS_CODE]: res.statusCode
            });
        }));
    }
    constructor(){
        this.metrics = _api.default.metrics.getMeter(_packagejson.name, _packagejson.version);
        this.counter = this.metrics.createCounter(`api_requests`, {
            description: 'Request Counter',
            unit: 'ms'
        });
        this.histogram = this.metrics.createHistogram('api_histogram', {
            description: 'Request Time'
        });
    }
};
MetricsInterceptor = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [])
], MetricsInterceptor);

//# sourceMappingURL=metrics.interceptor.js.map