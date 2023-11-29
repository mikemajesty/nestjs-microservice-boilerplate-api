"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "InfraModule", {
    enumerable: true,
    get: function() {
        return InfraModule;
    }
});
const _common = require("@nestjs/common");
const _memory = require("./cache/memory");
const _redis = require("./cache/redis");
const _mongo = require("./database/mongo");
const _module = require("./database/postgres/module");
const _http = require("./http");
const _logger = require("./logger");
const _secrets = require("./secrets");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let InfraModule = class InfraModule {
};
InfraModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _secrets.SecretsModule,
            _mongo.MongoDatabaseModule,
            _module.PostgresDatabaseModule,
            _logger.LoggerModule,
            _http.HttpModule,
            _redis.RedisCacheModule,
            _memory.MemoryCacheModule
        ]
    })
], InfraModule);

//# sourceMappingURL=module.js.map