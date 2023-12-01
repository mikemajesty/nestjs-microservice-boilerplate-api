"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _testing = require("@nestjs/testing");
const _logger = require("../../../../infra/logger");
const _adapter = require("../../../../modules/user/adapter");
const _exception = require("../../../../utils/exception");
const _request = require("../../../../utils/tests/mocks/request");
const _tests = require("../../../../utils/tests/tests");
const _user = require("../../entity/user");
const _user1 = require("../../repository/user");
const _usercreate = require("../user-create");
const userMock = new _user.UserEntity({
    id: (0, _tests.generateUUID)(),
    login: 'login',
    password: '**********',
    roles: [
        _user.UserRole.USER
    ]
});
describe('UserCreateUsecase', ()=>{
    let usecase;
    let repository;
    beforeEach(async ()=>{
        const app = await _testing.Test.createTestingModule({
            imports: [
                _logger.LoggerModule
            ],
            providers: [
                {
                    provide: _user1.IUserRepository,
                    useValue: {}
                },
                {
                    provide: _adapter.IUserCreateAdapter,
                    useFactory: (userRepository, logger)=>{
                        return new _usercreate.UserCreateUsecase(userRepository, logger);
                    },
                    inject: [
                        _user1.IUserRepository,
                        _logger.ILoggerAdapter
                    ]
                }
            ]
        }).compile();
        usecase = app.get(_adapter.IUserCreateAdapter);
        repository = app.get(_user1.IUserRepository);
    });
    test('when the user is created successfully, should expect an user that has been created', async ()=>{
        repository.findOne = jest.fn().mockResolvedValue(null);
        repository.create = jest.fn().mockResolvedValue(userMock);
        await expect(usecase.execute(userMock, _request.RequestMock.trancingMock)).resolves.toEqual(userMock);
    });
    test('when user already exists, should expect an error', async ()=>{
        repository.findOne = jest.fn().mockResolvedValue(userMock);
        await expect(usecase.execute(userMock, _request.RequestMock.trancingMock)).rejects.toThrowError(_exception.ApiConflictException);
    });
    test('when no input is specified, should expect an error', async ()=>{
        await (0, _tests.expectZodError)(()=>usecase.execute({}, _request.RequestMock.trancingMock), (issues)=>{
            expect(issues).toEqual([
                {
                    message: 'Required',
                    path: _user.UserEntity.nameof('login')
                },
                {
                    message: 'Required',
                    path: _user.UserEntity.nameof('password')
                },
                {
                    message: 'Required',
                    path: _user.UserEntity.nameof('roles')
                }
            ]);
        });
    });
});

//# sourceMappingURL=user-create.spec.js.map