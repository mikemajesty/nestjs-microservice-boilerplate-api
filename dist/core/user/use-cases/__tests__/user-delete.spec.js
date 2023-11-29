"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _testing = require("@nestjs/testing");
const _adapter = require("../../../../modules/user/adapter");
const _exception = require("../../../../utils/exception");
const _request = require("../../../../utils/tests/mocks/request");
const _tests = require("../../../../utils/tests/tests");
const _user = require("../../entity/user");
const _user1 = require("../../repository/user");
const _userdelete = require("../user-delete");
const userMock = new _user.UserEntity({
    id: (0, _tests.generateUUID)(),
    login: 'login',
    password: '**********',
    roles: [
        _user.UserRole.USER
    ]
});
describe('UserDeleteUsecase', ()=>{
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
                    provide: _adapter.IUserDeleteAdapter,
                    useFactory: (userRepository)=>{
                        return new _userdelete.UserDeleteUsecase(userRepository);
                    },
                    inject: [
                        _user1.IUserRepository
                    ]
                }
            ]
        }).compile();
        usecase = app.get(_adapter.IUserDeleteAdapter);
        repository = app.get(_user1.IUserRepository);
    });
    test('when no input is specified, should expect an error', async ()=>{
        await (0, _tests.expectZodError)(()=>usecase.execute({
                id: 'uuid'
            }, _request.RequestMock.trancingMock), (issues)=>{
            expect(issues).toEqual([
                {
                    message: 'Invalid uuid',
                    path: _user.UserEntity.nameof('id')
                }
            ]);
        });
    });
    test('when user not found, should expect an error', async ()=>{
        repository.findById = jest.fn().mockResolvedValue(null);
        await expect(usecase.execute({
            id: (0, _tests.generateUUID)()
        }, _request.RequestMock.trancingMock)).rejects.toThrowError(_exception.ApiNotFoundException);
    });
    test('when user deleted successfully, should expect an user that has been deleted.', async ()=>{
        repository.findById = jest.fn().mockResolvedValue(userMock);
        repository.updateOne = jest.fn();
        await expect(usecase.execute({
            id: (0, _tests.generateUUID)()
        }, _request.RequestMock.trancingMock)).resolves.toEqual({
            ...userMock,
            deletedAt: expect.any(Date)
        });
    });
});

//# sourceMappingURL=user-delete.spec.js.map