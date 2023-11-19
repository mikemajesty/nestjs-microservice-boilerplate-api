"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfraModule = void 0;
const common_1 = require("@nestjs/common");
const memory_1 = require("./cache/memory");
const redis_1 = require("./cache/redis");
const mongo_1 = require("./database/mongo");
const module_1 = require("./database/postgres/module");
const http_1 = require("./http");
const logger_1 = require("./logger");
const secrets_1 = require("./secrets");
let InfraModule = exports.InfraModule = class InfraModule {
};
exports.InfraModule = InfraModule = __decorate([
    (0, common_1.Module)({
        imports: [
            secrets_1.SecretsModule,
            mongo_1.MongoDatabaseModule,
            module_1.PostgresDatabaseModule,
            logger_1.LoggerModule,
            http_1.HttpModule,
            redis_1.RedisCacheModule,
            memory_1.MemoryCacheModule
        ]
    })
], InfraModule);
//# sourceMappingURL=module.js.map