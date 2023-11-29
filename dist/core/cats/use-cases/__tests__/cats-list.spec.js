"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _testing = require("@nestjs/testing");
const _catslist = require("../cats-list");
const _logger = require("../../../../infra/logger");
const _adapter = require("../../../../modules/cats/adapter");
const _tests = require("../../../../utils/tests/tests");
const _cats = require("../../entity/cats");
const _cats1 = require("../../repository/cats");
const catsMock = [
    new _cats.CatsEntity({
        id: (0, _tests.generateUUID)(),
        age: 10,
        breed: 'dummy',
        name: 'dummy',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
    })
];
describe('CatsListUsecase', ()=>{
    let usecase;
    let repository;
    beforeEach(async ()=>{
        const app = await _testing.Test.createTestingModule({
            imports: [
                _logger.LoggerModule
            ],
            providers: [
                {
                    provide: _cats1.ICatsRepository,
                    useValue: {}
                },
                {
                    provide: _adapter.ICatsListAdapter,
                    useFactory: (catsRepository)=>{
                        return new _catslist.CatsListUsecase(catsRepository);
                    },
                    inject: [
                        _cats1.ICatsRepository,
                        _logger.ILoggerAdapter
                    ]
                }
            ]
        }).compile();
        usecase = app.get(_adapter.ICatsListAdapter);
        repository = app.get(_cats1.ICatsRepository);
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
    test('when cats are found, should expect an user list', async ()=>{
        const response = {
            docs: catsMock,
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
            docs: catsMock,
            page: 1,
            limit: 1,
            total: 1
        });
    });
    test('when cats not found, should expect an empty list', async ()=>{
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

//# sourceMappingURL=cats-list.spec.js.map