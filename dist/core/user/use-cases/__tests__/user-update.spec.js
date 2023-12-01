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
const _userupdate = require("../user-update");
const userMock = new _user.UserEntity({
    id: (0, _tests.generateUUID)(),
    login: 'login',
    password: '**********',
    roles: [
        _user.UserRole.USER
    ]
});
describe('UserUpdateUsecase', ()=>{
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
                    provide: _adapter.IUserUpdateAdapter,
                    useFactory: (userRepository, logger)=>{
                        return new _userupdate.UserUpdateUsecase(userRepository, logger);
                    },
                    inject: [
                        _user1.IUserRepository,
                        _logger.ILoggerAdapter
                    ]
                }
            ]
        }).compile();
        usecase = app.get(_adapter.IUserUpdateAdapter);
        repository = app.get(_user1.IUserRepository);
    });
    test('when no input is specified, should expect an error', async ()=>{
        await (0, _tests.expectZodError)(()=>usecase.execute({}, _request.RequestMock.trancingMock), (issues)=>{
            expect(issues).toEqual([
                {
                    message: 'Required',
                    path: _user.UserEntity.nameof('id')
                }
            ]);
        });
    });
    test('when user updated successfully, should expect an user that has been updated', async ()=>{
        repository.findById = jest.fn().mockResolvedValue(userMock);
        repository.existsOnUpdate = jest.fn().mockResolvedValue(null);
        repository.updateOne = jest.fn().mockResolvedValue(null);
        await expect(usecase.execute(userMock, _request.RequestMock.trancingMock)).resolves.toEqual(userMock);
    });
    test('when user not found, should expect an error', async ()=>{
        repository.findById = jest.fn().mockResolvedValue(null);
        await expect(usecase.execute(userMock, _request.RequestMock.trancingMock)).rejects.toThrowError(_exception.ApiNotFoundException);
    });
    test('when user already exists, should expect an error', async ()=>{
        repository.findById = jest.fn().mockResolvedValue(userMock);
        repository.existsOnUpdate = jest.fn().mockResolvedValue(userMock);
        await expect(usecase.execute(userMock, _request.RequestMock.trancingMock)).rejects.toThrowError(_exception.ApiConflictException);
    });
});

//# sourceMappingURL=user-update.spec.js.map