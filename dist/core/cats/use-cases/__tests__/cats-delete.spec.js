"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _testing = require("@nestjs/testing");
const _catsdelete = require("../cats-delete");
const _logger = require("../../../../infra/logger");
const _adapter = require("../../../../modules/cats/adapter");
const _exception = require("../../../../utils/exception");
const _request = require("../../../../utils/tests/mocks/request");
const _tests = require("../../../../utils/tests/tests");
const _cats = require("../../entity/cats");
const _cats1 = require("../../repository/cats");
const catMock = new _cats.CatsEntity({
    id: (0, _tests.generateUUID)(),
    age: 10,
    breed: 'dummy',
    name: 'dummy'
});
describe('CatsDeleteUsecase', ()=>{
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
                    provide: _adapter.ICatsDeleteAdapter,
                    useFactory: (catsRepository)=>{
                        return new _catsdelete.CatsDeleteUsecase(catsRepository);
                    },
                    inject: [
                        _cats1.ICatsRepository,
                        _logger.ILoggerAdapter
                    ]
                }
            ]
        }).compile();
        usecase = app.get(_adapter.ICatsDeleteAdapter);
        repository = app.get(_cats1.ICatsRepository);
    });
    test('when no input is specified, should expect an error', async ()=>{
        await (0, _tests.expectZodError)(()=>usecase.execute({}, _request.RequestMock.trancingMock), (issues)=>{
            expect(issues).toEqual([
                {
                    message: 'Required',
                    path: _cats.CatsEntity.nameof('id')
                }
            ]);
        });
    });
    test('when cats not found, should expect an error', async ()=>{
        repository.findById = jest.fn().mockResolvedValue(null);
        await expect(usecase.execute({
            id: (0, _tests.generateUUID)()
        }, _request.RequestMock.trancingMock)).rejects.toThrowError(_exception.ApiNotFoundException);
    });
    test('when cats deleted successfully, should expect a cats that has been deleted', async ()=>{
        repository.findById = jest.fn().mockResolvedValue(catMock);
        repository.updateOne = jest.fn();
        await expect(usecase.execute({
            id: (0, _tests.generateUUID)()
        }, _request.RequestMock.trancingMock)).resolves.toEqual({
            ...catMock,
            deletedAt: expect.any(Date)
        });
    });
});

//# sourceMappingURL=cats-delete.spec.js.map