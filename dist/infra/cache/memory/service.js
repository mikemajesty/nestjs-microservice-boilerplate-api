"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "MemoryCacheService", {
    enumerable: true,
    get: function() {
        return MemoryCacheService;
    }
});
const _common = require("@nestjs/common");
const _nodecache = /*#__PURE__*/ _interop_require_default(require("node-cache"));
const _logger = require("../../logger");
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
let MemoryCacheService = class MemoryCacheService {
    connect(config) {
        this.client = new _nodecache.default(config || {
            stdTTL: 3600,
            checkperiod: 3600
        });
        this.logger.log('CacheMemory connected!');
        return this.client;
    }
    mSet(model) {
        return this.client.mset(model);
    }
    mGet(key) {
        return this.client.mget(key);
    }
    has(key) {
        return this.client.has(key);
    }
    set(key, value, config) {
        this.client.set(key, value, config);
    }
    del(key) {
        return !!this.client.del(key);
    }
    get(key) {
        return this.client.get(key);
    }
    pExpire(key, ttl) {
        return this.client.ttl(key, ttl);
    }
    constructor(logger){
        this.logger = logger;
    }
};
MemoryCacheService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _logger.ILoggerAdapter === "undefined" ? Object : _logger.ILoggerAdapter
    ])
], MemoryCacheService);

//# sourceMappingURL=service.js.map