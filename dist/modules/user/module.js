"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UserModule", {
    enumerable: true,
    get: function() {
        return UserModule;
    }
});
const _common = require("@nestjs/common");
const _mongoose = require("@nestjs/mongoose");
const _user = require("../../core/user/repository/user");
const _usercreate = require("../../core/user/use-cases/user-create");
const _userdelete = require("../../core/user/use-cases/user-delete");
const _usergetByID = require("../../core/user/use-cases/user-getByID");
const _userlist = require("../../core/user/use-cases/user-list");
const _userupdate = require("../../core/user/use-cases/user-update");
const _redis = require("../../infra/cache/redis");
const _enum = require("../../infra/database/enum");
const _user1 = require("../../infra/database/mongo/schemas/user");
const _logger = require("../../infra/logger");
const _secrets = require("../../infra/secrets");
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
let UserModule = class UserModule {
    configure(consumer) {
        consumer.apply(_isloggedmiddleware.IsLoggedMiddleware).forRoutes(_controller.UserController);
    }
};
UserModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _auth.TokenModule,
            _secrets.SecretsModule,
            _logger.LoggerModule,
            _redis.RedisCacheModule
        ],
        controllers: [
            _controller.UserController
        ],
        providers: [
            {
                provide: _user.IUserRepository,
                useFactory: async (connection)=>{
                    //  use if you want transaction
                    const repository = connection.model(_user1.User.name, _user1.UserSchema);
                    repository.connection = connection;
                    // use if you not want transaction
                    // const repository: PaginateModel<UserDocument> = connection.model<UserDocument, Model>(
                    //   User.name,
                    //   UserSchema as Schema
                    // );
                    return new _repository.UserRepository(repository);
                },
                inject: [
                    (0, _mongoose.getConnectionToken)(_enum.ConnectionName.USER)
                ]
            },
            {
                provide: _adapter.IUserCreateAdapter,
                useFactory: (userRepository, loggerService)=>{
                    return new _usercreate.UserCreateUsecase(userRepository, loggerService);
                },
                inject: [
                    _user.IUserRepository,
                    _logger.ILoggerAdapter
                ]
            },
            {
                provide: _adapter.IUserUpdateAdapter,
                useFactory: (userRepository, loggerService)=>{
                    return new _userupdate.UserUpdateUsecase(userRepository, loggerService);
                },
                inject: [
                    _user.IUserRepository,
                    _logger.ILoggerAdapter
                ]
            },
            {
                provide: _adapter.IUserListAdapter,
                useFactory: (userRepository)=>{
                    return new _userlist.UserListUsecase(userRepository);
                },
                inject: [
                    _user.IUserRepository
                ]
            },
            {
                provide: _adapter.IUserDeleteAdapter,
                useFactory: (userRepository)=>{
                    return new _userdelete.UserDeleteUsecase(userRepository);
                },
                inject: [
                    _user.IUserRepository
                ]
            },
            {
                provide: _adapter.IUserGetByIDAdapter,
                useFactory: (userRepository)=>{
                    return new _usergetByID.UserGetByIdUsecase(userRepository);
                },
                inject: [
                    _user.IUserRepository
                ]
            }
        ],
        exports: [
            _user.IUserRepository,
            _adapter.IUserCreateAdapter,
            _adapter.IUserUpdateAdapter,
            _adapter.IUserListAdapter,
            _adapter.IUserDeleteAdapter,
            _adapter.IUserGetByIDAdapter
        ]
    })
], UserModule);

//# sourceMappingURL=module.js.map