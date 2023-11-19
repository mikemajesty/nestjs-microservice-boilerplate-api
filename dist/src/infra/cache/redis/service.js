"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const redis_1 = require("redis");
const logger_1 = require("../../logger");
const exception_1 = require("../../../utils/exception");
let RedisService = exports.RedisService = class RedisService {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.client = (0, redis_1.createClient)(this.config);
    }
    async isConnected() {
        const ping = await this.client.ping();
        if (ping !== 'PONG')
            this.throwException('redis disconnected.');
    }
    async connect() {
        try {
            await this.client.connect();
            this.logger.log('Redis connected!\n');
            return this.client;
        }
        catch (error) {
            throw new exception_1.ApiInternalServerException(error.message);
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
        for (const model of redisList) {
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
        throw new exception_1.ApiInternalServerException(error);
    }
};
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object, logger_1.ILoggerAdapter])
], RedisService);
//# sourceMappingURL=service.js.map