"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _testing = require("@nestjs/testing");
const _adapter = require("../../../../modules/user/adapter");
const _exception = require("../../../../utils/exception");
const _tests = require("../../../../utils/tests/tests");
const _user = require("../../entity/user");
const _user1 = require("../../repository/user");
const _usergetByID = require("../user-getByID");
const userMock = new _user.UserEntity({
    id: (0, _tests.generateUUID)(),
    login: 'login',
    password: '**********',
    roles: [
        _user.UserRole.USER
    ]
});
describe('UserGetByIdUsecase', ()=>{
    let usecase;
    let repository;
    beforeEach(async ()=>{
        const app = await _testing.Test.createTestingModule({
            imports: [],
            providers: [
                {
                    provide: _user1.IUserRepository,
                    useValue: {}
                },
                {
                    provide: _adapter.IUserGetByIDAdapter,
                    useFactory: (userRepository)=>{
                        return new _usergetByID.UserGetByIdUsecase(userRepository);
                    },
                    inject: [
                        _user1.IUserRepository
                    ]
                }
            ]
        }).compile();
        usecase = app.get(_adapter.IUserGetByIDAdapter);
        repository = app.get(_user1.IUserRepository);
    });
    test('when no input is specified, should expect an error', async ()=>{
        await (0, _tests.expectZodError)(()=>usecase.execute({}), (issues)=>{
            expect(issues).toEqual([
                {
                    message: 'Required',
                    path: _user.UserEntity.nameof('id')
                }
            ]);
        });
    });
    test('when user not found, should expect an errror', async ()=>{
        repository.findById = jest.fn().mockResolvedValue(null);
        await expect(usecase.execute({
            id: (0, _tests.generateUUID)()
        })).rejects.toThrowError(_exception.ApiNotFoundException);
    });
    test('when user getById successfully, should expect a user', async ()=>{
        repository.findById = jest.fn().mockResolvedValue(userMock);
        await expect(usecase.execute({
            id: (0, _tests.generateUUID)()
        })).resolves.toEqual(userMock);
    });
});

//# sourceMappingURL=user-getByID.spec.js.map