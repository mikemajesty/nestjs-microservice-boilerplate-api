import { Injectable } from '@nestjs/common';
import { createClient, RedisClientOptions, RedisClientType } from 'redis';

import { ILoggerAdapter } from '@/infra/logger';
import { ApiInternalServerException } from '@/utils/exception';

import { ICacheAdapter } from '../adapter';
import { CacheKeyArgument, CacheKeyValue, CacheValueArgument } from '../types';

@Injectable()
export class RedisService implements Partial<ICacheAdapter<RedisClientType>> {
  client: RedisClientType;

  constructor(
    private readonly config: RedisClientOptions,
    private readonly logger: ILoggerAdapter
  ) {
    this.client = createClient(this.config) as RedisClientType;
  }

  async isConnected(): Promise<void> {
    const ping = await this.client.ping();
    if (ping !== 'PONG') new ApiInternalServerException('redis disconnected.');
  }

  async connect(): Promise<RedisClientType> {
    try {
      await this.client.connect();
      this.logger.log('🎯 redis connected!\n');
      return this.client;
    } catch (error) {
      throw new ApiInternalServerException(error.message, { context: `${RedisService.name}/connect` });
    }
  }

  async set(key: CacheKeyArgument, value: CacheValueArgument, config?: unknown): Promise<void> {
    await this.client.set(key, value, config);
  }

  async get(key: CacheKeyArgument): Promise<string> {
    const getResult = await this.client.get(key);

    return getResult;
  }

  async del(key: CacheKeyArgument): Promise<void> {
    await this.client.del(key);
  }

  async setMulti(redisList: CacheKeyValue[]): Promise<void> {
    const multi = this.client.multi();

    for (const model of redisList) {
      multi.rPush(model.key, model.value);
    }

    await multi.exec();
  }

  async pExpire(key: CacheKeyArgument, milliseconds: number): Promise<void> {
    await this.client.pExpire(key, milliseconds);
  }

  async hGet(key: CacheKeyArgument, field: CacheKeyArgument): Promise<unknown | unknown[]> {
    return await this.client.hGet(key, field);
  }

  async hSet(key: CacheKeyArgument, field: CacheKeyArgument, value: CacheValueArgument): Promise<number> {
    return await this.client.hSet(key, field, value);
  }

  async hGetAll(key: CacheKeyArgument): Promise<unknown | unknown[]> {
    return await this.client.hGetAll(key);
  }
}
