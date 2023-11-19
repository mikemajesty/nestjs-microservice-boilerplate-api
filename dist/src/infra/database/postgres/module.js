"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresDatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const logger_1 = require("../../logger");
const adapter_1 = require("../adapter");
const config_1 = require("./config");
const service_1 = require("./service");
let PostgresDatabaseModule = exports.PostgresDatabaseModule = class PostgresDatabaseModule {
};
exports.PostgresDatabaseModule = PostgresDatabaseModule = __decorate([
    (0, common_1.Module)({
        imports: [logger_1.LoggerModule],
        providers: [
            {
                provide: adapter_1.IDataBaseAdapter,
                useFactory: async (logger) => {
                    const postgres = new service_1.SequelizeService(config_1.sequelizeConfig, logger);
                    await postgres.connect();
                    return postgres;
                },
                inject: [logger_1.ILoggerAdapter]
            }
        ],
        exports: [adapter_1.IDataBaseAdapter]
    })
], PostgresDatabaseModule);
//# sourceMappingURL=module.js.map