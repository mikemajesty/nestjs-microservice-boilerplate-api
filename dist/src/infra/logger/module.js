"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerModule = void 0;
const common_1 = require("@nestjs/common");
const secrets_1 = require("../secrets");
const adapter_1 = require("./adapter");
const service_1 = require("./service");
let LoggerModule = class LoggerModule {
};
LoggerModule = __decorate([
    (0, common_1.Module)({
        imports: [secrets_1.SecretsModule],
        providers: [
            {
                provide: adapter_1.ILoggerAdapter,
                useFactory: ({ LOGER_LEVEL }) => {
                    const logger = new service_1.LoggerService();
                    logger.connect(LOGER_LEVEL);
                    return logger;
                },
                inject: [secrets_1.ISecretsAdapter]
            }
        ],
        exports: [adapter_1.ILoggerAdapter]
    })
], LoggerModule);
exports.LoggerModule = LoggerModule;
//# sourceMappingURL=module.js.map