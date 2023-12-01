"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _testing = require("@nestjs/testing");
const _auth = require("../../../../libs/auth");
const _adapter = require("../../../../modules/login/adapter");
const _exception = require("../../../../utils/exception");
const _request = require("../../../../utils/tests/mocks/request");
const _tests = require("../../../../utils/tests/tests");
const _user = require("../../entity/user");
const _user1 = require("../../repository/user");
const _userlogin = require("../user-login");
const userMock = new _user.UserEntity({
    id: (0, _tests.generateUUID)(),
    login: 'login',
    password: '**********',
    roles: [
        _user.UserRole.USER
    ]
});
describe('LoginUsecase', ()=>{
    let usecase;
    let repository;
    beforeEach(async ()=>{
        const app = await _testing.Test.createTestingModule({
            imports: [
                _auth.TokenModule
            ],
            providers: [
                {
                    provide: _user1.IUserRepository,
                    useValue: {}
                },
                {
                    provide: _adapter.ILoginAdapter,
                    useFactory: (userRepository, token)=>{
                        return new _userlogin.LoginUsecase(userRepository, token);
                    },
                    inject: [
                        _user1.IUserRepository,
                        _auth.ITokenAdapter
                    ]
                }
            ]
        }).compile();
        usecase = app.get(_adapter.ILoginAdapter);
        repository = app.get(_user1.IUserRepository);
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
                }
            ]);
        });
    });
    test('when user not found, should expect an error', async ()=>{
        repository.findOne = jest.fn().mockResolvedValue(null);
        await expect(usecase.execute({
            login: 'login',
            password: 'password'
        }, _request.RequestMock.trancingMock)).rejects.toThrowError(_exception.ApiNotFoundException);
    });
    test('when user found, should expect a token', async ()=>{
        repository.findOne = jest.fn().mockResolvedValue(userMock);
        await expect(usecase.execute({
            login: 'login',
            password: 'password'
        }, _request.RequestMock.trancingMock)).resolves.toEqual({
            token: expect.any(String)
        });
    });
});

//# sourceMappingURL=user-login.spec.js.map