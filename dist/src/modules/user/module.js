"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const user_1 = require("../../core/user/repository/user");
const user_create_1 = require("../../core/user/use-cases/user-create");
const user_delete_1 = require("../../core/user/use-cases/user-delete");
const user_getByID_1 = require("../../core/user/use-cases/user-getByID");
const user_list_1 = require("../../core/user/use-cases/user-list");
const user_update_1 = require("../../core/user/use-cases/user-update");
const redis_1 = require("../../infra/cache/redis");
const enum_1 = require("../../infra/database/enum");
const user_2 = require("../../infra/database/mongo/schemas/user");
const logger_1 = require("../../infra/logger");
const secrets_1 = require("../../infra/secrets");
const auth_1 = require("../../libs/auth");
const is_logged_middleware_1 = require("../../utils/middlewares/is-logged.middleware");
const adapter_1 = require("./adapter");
const controller_1 = require("./controller");
const repository_1 = require("./repository");
let UserModule = class UserModule {
    configure(consumer) {
        consumer.apply(is_logged_middleware_1.IsLoggedMiddleware).forRoutes(controller_1.UserController);
    }
};
UserModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_1.TokenModule, secrets_1.SecretsModule, logger_1.LoggerModule, redis_1.RedisCacheModule],
        controllers: [controller_1.UserController],
        providers: [
            {
                provide: user_1.IUserRepository,
                useFactory: async (connection) => {
                    const repository = connection.model(user_2.User.name, user_2.UserSchema);
                    repository.connection = connection;
                    return new repository_1.UserRepository(repository);
                },
                inject: [(0, mongoose_1.getConnectionToken)(enum_1.ConnectionName.USER)]
            },
            {
                provide: adapter_1.IUserCreateAdapter,
                useFactory: (userRepository, loggerService) => {
                    return new user_create_1.UserCreateUsecase(userRepository, loggerService);
                },
                inject: [user_1.IUserRepository, logger_1.ILoggerAdapter]
            },
            {
                provide: adapter_1.IUserUpdateAdapter,
                useFactory: (userRepository, loggerService) => {
                    return new user_update_1.UserUpdateUsecase(userRepository, loggerService);
                },
                inject: [user_1.IUserRepository, logger_1.ILoggerAdapter]
            },
            {
                provide: adapter_1.IUserListAdapter,
                useFactory: (userRepository) => {
                    return new user_list_1.UserListUsecase(userRepository);
                },
                inject: [user_1.IUserRepository]
            },
            {
                provide: adapter_1.IUserDeleteAdapter,
                useFactory: (userRepository) => {
                    return new user_delete_1.UserDeleteUsecase(userRepository);
                },
                inject: [user_1.IUserRepository]
            },
            {
                provide: adapter_1.IUserGetByIDAdapter,
                useFactory: (userRepository) => {
                    return new user_getByID_1.UserGetByIdUsecase(userRepository);
                },
                inject: [user_1.IUserRepository]
            }
        ],
        exports: [
            user_1.IUserRepository,
            adapter_1.IUserCreateAdapter,
            adapter_1.IUserUpdateAdapter,
            adapter_1.IUserListAdapter,
            adapter_1.IUserDeleteAdapter,
            adapter_1.IUserGetByIDAdapter
        ]
    })
], UserModule);
exports.UserModule = UserModule;
//# sourceMappingURL=module.js.map