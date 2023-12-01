"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _testing = require("@nestjs/testing");
const _logger = require("../../../../infra/logger");
const _adapter = require("../../../../modules/cats/adapter");
const _exception = require("../../../../utils/exception");
const _request = require("../../../../utils/tests/mocks/request");
const _tests = require("../../../../utils/tests/tests");
const _cats = require("../../entity/cats");
const _cats1 = require("../../repository/cats");
const _catscreate = require("../cats-create");
const catCreateMock = new _cats.CatsEntity({
    id: (0, _tests.generateUUID)(),
    age: 10,
    breed: 'dummy',
    name: 'dummy'
});
describe('CatsCreateUsecase', ()=>{
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
                    provide: _adapter.ICatsCreateAdapter,
                    useFactory: (catsRepository)=>{
                        return new _catscreate.CatsCreateUsecase(catsRepository);
                    },
                    inject: [
                        _cats1.ICatsRepository
                    ]
                }
            ]
        }).compile();
        usecase = app.get(_adapter.ICatsCreateAdapter);
        repository = app.get(_cats1.ICatsRepository);
    });
    test('when no input is specified, should expect an error', async ()=>{
        await (0, _tests.expectZodError)(()=>usecase.execute({}, _request.RequestMock.trancingMock), (issues)=>{
            expect(issues).toEqual([
                {
                    message: 'Required',
                    path: _cats.CatsEntity.nameof('name')
                },
                {
                    message: 'Required',
                    path: _cats.CatsEntity.nameof('breed')
                },
                {
                    message: 'Required',
                    path: _cats.CatsEntity.nameof('age')
                }
            ]);
        });
    });
    test('when cats created successfully, should expect a cats that has been created', async ()=>{
        repository.create = jest.fn().mockResolvedValue(catCreateMock);
        repository.startSession = jest.fn().mockResolvedValue({
            commit: jest.fn(),
            rollback: jest.fn()
        });
        await expect(usecase.execute(catCreateMock, _request.RequestMock.trancingMock)).resolves.toEqual(catCreateMock);
    });
    test('when transaction throw an error, should expect an error', async ()=>{
        repository.startSession = jest.fn().mockResolvedValue({
            commit: jest.fn(),
            rollback: jest.fn()
        });
        repository.create = jest.fn().mockRejectedValue(new _exception.ApiInternalServerException());
        await expect(usecase.execute(catCreateMock, _request.RequestMock.trancingMock)).rejects.toThrow(_exception.ApiInternalServerException);
    });
});

//# sourceMappingURL=cats-create.spec.js.map