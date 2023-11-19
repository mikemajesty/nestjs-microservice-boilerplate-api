"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatsModule = void 0;
const common_1 = require("@nestjs/common");
const cats_1 = require("../../core/cats/repository/cats");
const cats_create_1 = require("../../core/cats/use-cases/cats-create");
const cats_delete_1 = require("../../core/cats/use-cases/cats-delete");
const cats_getByID_1 = require("../../core/cats/use-cases/cats-getByID");
const cats_list_1 = require("../../core/cats/use-cases/cats-list");
const cats_update_1 = require("../../core/cats/use-cases/cats-update");
const redis_1 = require("../../infra/cache/redis");
const database_1 = require("../../infra/database");
const module_1 = require("../../infra/database/postgres/module");
const cats_2 = require("../../infra/database/postgres/schemas/cats");
const logger_1 = require("../../infra/logger");
const auth_1 = require("../../libs/auth");
const is_logged_middleware_1 = require("../../utils/middlewares/is-logged.middleware");
const adapter_1 = require("./adapter");
const controller_1 = require("./controller");
const repository_1 = require("./repository");
let CatsModule = exports.CatsModule = class CatsModule {
    configure(consumer) {
        consumer.apply(is_logged_middleware_1.IsLoggedMiddleware).forRoutes(controller_1.CatsController);
    }
};
exports.CatsModule = CatsModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_1.TokenModule, logger_1.LoggerModule, redis_1.RedisCacheModule, module_1.PostgresDatabaseModule],
        controllers: [controller_1.CatsController],
        providers: [
            {
                provide: cats_1.ICatsRepository,
                useFactory: (database) => {
                    const repossitory = database.getDatabase().model(cats_2.CatsSchema);
                    return new repository_1.CatsRepository(repossitory);
                },
                inject: [database_1.IDataBaseAdapter]
            },
            {
                provide: adapter_1.ICatsCreateAdapter,
                useFactory: (repository) => new cats_create_1.CatsCreateUsecase(repository),
                inject: [cats_1.ICatsRepository]
            },
            {
                provide: adapter_1.ICatsUpdateAdapter,
                useFactory: (logger, repository) => new cats_update_1.CatsUpdateUsecase(repository, logger),
                inject: [logger_1.ILoggerAdapter, cats_1.ICatsRepository]
            },
            {
                provide: adapter_1.ICatsGetByIDAdapter,
                useFactory: (repository) => new cats_getByID_1.CatsGetByIdUsecase(repository),
                inject: [cats_1.ICatsRepository]
            },
            {
                provide: adapter_1.ICatsListAdapter,
                useFactory: (repository) => new cats_list_1.CatsListUsecase(repository),
                inject: [cats_1.ICatsRepository]
            },
            {
                provide: adapter_1.ICatsDeleteAdapter,
                useFactory: (repository) => new cats_delete_1.CatsDeleteUsecase(repository),
                inject: [cats_1.ICatsRepository]
            }
        ],
        exports: []
    })
], CatsModule);
//# sourceMappingURL=module.js.map