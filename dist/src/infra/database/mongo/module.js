"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const secrets_1 = require("../../secrets");
const enum_1 = require("../enum");
const service_1 = require("./service");
let MongoDatabaseModule = exports.MongoDatabaseModule = class MongoDatabaseModule {
};
exports.MongoDatabaseModule = MongoDatabaseModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forRootAsync({
                connectionName: enum_1.ConnectionName.USER,
                useFactory: ({ MONGO_URL }) => {
                    return new service_1.MongoService().getConnection({ URI: MONGO_URL });
                },
                imports: [secrets_1.SecretsModule],
                inject: [secrets_1.ISecretsAdapter]
            })
        ]
    })
], MongoDatabaseModule);
//# sourceMappingURL=module.js.map