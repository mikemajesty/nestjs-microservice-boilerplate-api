"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _testing = require("@nestjs/testing");
const _adapter = require("../../../../modules/user/adapter");
const _tests = require("../../../../utils/tests/tests");
const _user = require("../../entity/user");
const _user1 = require("../../repository/user");
const _userlist = require("../user-list");
const userMock = new _user.UserEntity({
    id: (0, _tests.generateUUID)(),
    login: 'login',
    password: '**********',
    roles: [
        _user.UserRole.USER
    ]
});
const usersMock = [
    new _user.UserEntity({
        ...userMock,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
    })
];
describe('UserListUsecase', ()=>{
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
                    provide: _adapter.IUserListAdapter,
                    useFactory: (userRepository)=>{
                        return new _userlist.UserListUsecase(userRepository);
                    },
                    inject: [
                        _user1.IUserRepository
                    ]
                }
            ]
        }).compile();
        usecase = app.get(_adapter.IUserListAdapter);
        repository = app.get(_user1.IUserRepository);
    });
    test('when no input is specified, should expect an error', async ()=>{
        await (0, _tests.expectZodError)(()=>usecase.execute({
                search: null,
                sort: null,
                limit: 10,
                page: 1
            }), (issues)=>{
            expect(issues).toEqual([
                {
                    message: 'Expected object, received null',
                    path: 'sort'
                }
            ]);
        });
    });
    test('when users are found, should expect an user list', async ()=>{
        const response = {
            docs: usersMock,
            page: 1,
            limit: 1,
            total: 1
        };
        repository.paginate = jest.fn().mockResolvedValue(response);
        await expect(usecase.execute({
            limit: 1,
            page: 1,
            search: {},
            sort: {
                createdAt: -1
            }
        })).resolves.toEqual({
            docs: usersMock,
            page: 1,
            limit: 1,
            total: 1
        });
    });
    test('when users not found, should expect an empty list', async ()=>{
        const response = {
            docs: [],
            page: 1,
            limit: 1,
            total: 1
        };
        repository.paginate = jest.fn().mockResolvedValue(response);
        await expect(usecase.execute({
            limit: 1,
            page: 1,
            search: {},
            sort: {
                createdAt: -1
            }
        })).resolves.toEqual(response);
    });
});

//# sourceMappingURL=user-list.spec.js.map