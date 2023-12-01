"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _testing = require("@nestjs/testing");
const _cache = require("../../../../infra/cache");
const _secrets = require("../../../../infra/secrets");
const _auth = require("../../../../libs/auth");
const _adapter = require("../../../../modules/logout/adapter");
const _request = require("../../../../utils/tests/mocks/request");
const _tests = require("../../../../utils/tests/tests");
const _userlogout = require("../user-logout");
describe('LogoutUsecase', ()=>{
    let usecase;
    let cache;
    beforeEach(async ()=>{
        const app = await _testing.Test.createTestingModule({
            imports: [
                _auth.TokenModule,
                _secrets.SecretsModule
            ],
            providers: [
                {
                    provide: _cache.ICacheAdapter,
                    useValue: {
                        set: jest.fn()
                    }
                },
                {
                    provide: _adapter.ILogoutAdapter,
                    useFactory: (cache, secrets)=>{
                        return new _userlogout.LogoutUsecase(cache, secrets);
                    },
                    inject: [
                        _cache.ICacheAdapter,
                        _secrets.ISecretsAdapter
                    ]
                }
            ]
        }).compile();
        usecase = app.get(_adapter.ILogoutAdapter);
        cache = app.get(_cache.ICacheAdapter);
    });
    test('when no input is specified, should expect an error', async ()=>{
        await (0, _tests.expectZodError)(()=>usecase.execute({}, _request.RequestMock.trancingMock), (issues)=>{
            expect(issues).toEqual([
                {
                    message: 'Required',
                    path: 'token'
                }
            ]);
        });
    });
    test('when user logout, should expect set token to blacklist', async ()=>{
        cache.set = jest.fn();
        await expect(usecase.execute({
            token: '12345678910'
        }, _request.RequestMock.trancingMock)).resolves.toBeUndefined();
    });
});

//# sourceMappingURL=user-logout.spec.js.map