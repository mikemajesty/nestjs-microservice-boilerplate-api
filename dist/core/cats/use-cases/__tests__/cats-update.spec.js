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
const _catsupdate = require("../cats-update");
const catMock = new _cats.CatsEntity({
    id: (0, _tests.generateUUID)(),
    age: 10,
    breed: 'dummy',
    name: 'dummy'
});
describe('CatsUpdateUsecase', ()=>{
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
                    provide: _adapter.ICatsUpdateAdapter,
                    useFactory: (catsRepository, logger)=>{
                        return new _catsupdate.CatsUpdateUsecase(catsRepository, logger);
                    },
                    inject: [
                        _cats1.ICatsRepository,
                        _logger.ILoggerAdapter
                    ]
                }
            ]
        }).compile();
        usecase = app.get(_adapter.ICatsUpdateAdapter);
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
    test('when cats updated successfully, should expect an cats that has been updated', async ()=>{
        repository.findById = jest.fn().mockResolvedValue(catMock);
        repository.updateOne = jest.fn().mockResolvedValue(null);
        await expect(usecase.execute({
            id: (0, _tests.generateUUID)()
        }, _request.RequestMock.trancingMock)).resolves.toEqual(catMock);
    });
});

//# sourceMappingURL=cats-update.spec.js.map