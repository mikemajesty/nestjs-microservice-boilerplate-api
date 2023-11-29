"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RedisService", {
    enumerable: true,
    get: function() {
        return RedisService;
    }
});
const _common = require("@nestjs/common");
const _redis = require("redis");
const _logger = require("../../logger");
const _exception = require("../../../utils/exception");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let RedisService = class RedisService {
    async isConnected() {
        const ping = await this.client.ping();
        if (ping !== 'PONG') this.throwException('redis disconnected.');
    }
    async connect() {
        try {
            await this.client.connect();
            this.logger.log('Redis connected!\n');
            return this.client;
        } catch (error) {
            throw new _exception.ApiInternalServerException(error.message);
        }
    }
    async set(key, value, config) {
        await this.client.set(key, value, config);
    }
    async get(key) {
        const getResult = await this.client.get(key);
        return getResult;
    }
    async del(key) {
        await this.client.del(key);
    }
    async setMulti(redisList) {
        const multi = this.client.multi();
        for (const model of redisList){
            multi.rPush(model.key, model.value);
        }
        await multi.exec();
    }
    async pExpire(key, miliseconds) {
        await this.client.pExpire(key, miliseconds);
    }
    async hGet(key, field) {
        return await this.client.hGet(key, field);
    }
    async hSet(key, field, value) {
        return await this.client.hSet(key, field, value);
    }
    async hGetAll(key) {
        return await this.client.hGetAll(key);
    }
    throwException(error) {
        throw new _exception.ApiInternalServerException(error);
    }
    constructor(config, logger){
        this.config = config;
        this.logger = logger;
        this.client = (0, _redis.createClient)(this.config);
    }
};
RedisService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _redis.RedisClientOptions === "undefined" ? Object : _redis.RedisClientOptions,
        typeof _logger.ILoggerAdapter === "undefined" ? Object : _logger.ILoggerAdapter
    ])
], RedisService);

//# sourceMappingURL=service.js.map