"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "MongoDatabaseModule", {
    enumerable: true,
    get: function() {
        return MongoDatabaseModule;
    }
});
const _common = require("@nestjs/common");
const _mongoose = require("@nestjs/mongoose");
const _secrets = require("../../secrets");
const _enum = require("../enum");
const _service = require("./service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let MongoDatabaseModule = class MongoDatabaseModule {
};
MongoDatabaseModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _mongoose.MongooseModule.forRootAsync({
                connectionName: _enum.ConnectionName.USER,
                useFactory: ({ MONGO_URL })=>{
                    return new _service.MongoService().getConnection({
                        URI: MONGO_URL
                    });
                },
                imports: [
                    _secrets.SecretsModule
                ],
                inject: [
                    _secrets.ISecretsAdapter
                ]
            })
        ]
    })
], MongoDatabaseModule);

//# sourceMappingURL=module.js.map