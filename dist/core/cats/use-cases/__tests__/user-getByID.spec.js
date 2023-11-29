"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _testing = require("@nestjs/testing");
const _logger = require("../../../../infra/logger");
const _adapter = require("../../../../modules/cats/adapter");
const _exception = require("../../../../utils/exception");
const _tests = require("../../../../utils/tests/tests");
const _cats = require("../../entity/cats");
const _cats1 = require("../../repository/cats");
const _catsgetByID = require("../cats-getByID");
const catMock = new _cats.CatsEntity({
    id: (0, _tests.generateUUID)(),
    age: 10,
    breed: 'dummy',
    name: 'dummy'
});
describe('CatsGetByIdUsecase', ()=>{
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
                    provide: _adapter.ICatsGetByIDAdapter,
                    useFactory: (catsRepository)=>{
                        return new _catsgetByID.CatsGetByIdUsecase(catsRepository);
                    },
                    inject: [
                        _cats1.ICatsRepository,
                        _logger.ILoggerAdapter
                    ]
                }
            ]
        }).compile();
        usecase = app.get(_adapter.ICatsGetByIDAdapter);
        repository = app.get(_cats1.ICatsRepository);
    });
    test('when no input is specified, should expect an error', async ()=>{
        await (0, _tests.expectZodError)(()=>usecase.execute({}), (issues)=>{
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
        })).rejects.toThrowError(_exception.ApiNotFoundException);
    });
    test('when cats found, should expect a cats that has been found', async ()=>{
        repository.findById = jest.fn().mockResolvedValue(catMock);
        await expect(usecase.execute({
            id: (0, _tests.generateUUID)()
        })).resolves.toEqual(catMock);
    });
});

//# sourceMappingURL=user-getByID.spec.js.map