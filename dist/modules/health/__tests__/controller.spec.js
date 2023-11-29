"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _testing = require("@nestjs/testing");
const _packagejson = require("package.json");
const _controller = require("../controller");
describe('HealthController', ()=>{
    let healthController;
    beforeEach(async ()=>{
        const app = await _testing.Test.createTestingModule({
            controllers: [
                _controller.HealthController
            ]
        }).compile();
        healthController = app.get(_controller.HealthController);
    });
    describe('root', ()=>{
        it('should return "Hello World!"', async ()=>{
            expect(await healthController.getHealth()).toBe(`${_packagejson.name}:${_packagejson.version} available!`);
        });
    });
});

//# sourceMappingURL=controller.spec.js.map