"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CatsModule", {
    enumerable: true,
    get: function() {
        return CatsModule;
    }
});
const _common = require("@nestjs/common");
const _cats = require("../../core/cats/repository/cats");
const _catscreate = require("../../core/cats/use-cases/cats-create");
const _catsdelete = require("../../core/cats/use-cases/cats-delete");
const _catsgetByID = require("../../core/cats/use-cases/cats-getByID");
const _catslist = require("../../core/cats/use-cases/cats-list");
const _catsupdate = require("../../core/cats/use-cases/cats-update");
const _redis = require("../../infra/cache/redis");
const _database = require("../../infra/database");
const _module = require("../../infra/database/postgres/module");
const _cats1 = require("../../infra/database/postgres/schemas/cats");
const _logger = require("../../infra/logger");
const _auth = require("../../libs/auth");
const _isloggedmiddleware = require("../../utils/middlewares/is-logged.middleware");
const _adapter = require("./adapter");
const _controller = require("./controller");
const _repository = require("./repository");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let CatsModule = class CatsModule {
    configure(consumer) {
        consumer.apply(_isloggedmiddleware.IsLoggedMiddleware).forRoutes(_controller.CatsController);
    }
};
CatsModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _auth.TokenModule,
            _logger.LoggerModule,
            _redis.RedisCacheModule,
            _module.PostgresDatabaseModule
        ],
        controllers: [
            _controller.CatsController
        ],
        providers: [
            {
                provide: _cats.ICatsRepository,
                useFactory: (database)=>{
                    const repossitory = database.getDatabase().model(_cats1.CatsSchema);
                    return new _repository.CatsRepository(repossitory);
                },
                inject: [
                    _database.IDataBaseAdapter
                ]
            },
            {
                provide: _adapter.ICatsCreateAdapter,
                useFactory: (repository)=>new _catscreate.CatsCreateUsecase(repository),
                inject: [
                    _cats.ICatsRepository
                ]
            },
            {
                provide: _adapter.ICatsUpdateAdapter,
                useFactory: (logger, repository)=>new _catsupdate.CatsUpdateUsecase(repository, logger),
                inject: [
                    _logger.ILoggerAdapter,
                    _cats.ICatsRepository
                ]
            },
            {
                provide: _adapter.ICatsGetByIDAdapter,
                useFactory: (repository)=>new _catsgetByID.CatsGetByIdUsecase(repository),
                inject: [
                    _cats.ICatsRepository
                ]
            },
            {
                provide: _adapter.ICatsListAdapter,
                useFactory: (repository)=>new _catslist.CatsListUsecase(repository),
                inject: [
                    _cats.ICatsRepository
                ]
            },
            {
                provide: _adapter.ICatsDeleteAdapter,
                useFactory: (repository)=>new _catsdelete.CatsDeleteUsecase(repository),
                inject: [
                    _cats.ICatsRepository
                ]
            }
        ],
        exports: []
    })
], CatsModule);

//# sourceMappingURL=module.js.map