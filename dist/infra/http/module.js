"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "HttpModule", {
    enumerable: true,
    get: function() {
        return HttpModule;
    }
});
const _common = require("@nestjs/common");
const _logger = require("../logger");
const _adapter = require("./adapter");
const _service = require("./service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let HttpModule = class HttpModule {
};
HttpModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _logger.LoggerModule
        ],
        providers: [
            {
                provide: _adapter.IHttpAdapter,
                useClass: _service.HttpService
            }
        ],
        exports: [
            _adapter.IHttpAdapter
        ]
    })
], HttpModule);

//# sourceMappingURL=module.js.map