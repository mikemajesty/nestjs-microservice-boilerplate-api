import { Injectable } from '@nestjs/common';
import * as NodeCache from 'node-cache';

import { ILoggerAdapter } from '@/infra/logger';
import { ApiInternalServerException } from '@/utils/exception';

import { ICacheAdapter } from '../adapter';
import { MemoryCacheKeyArgument, MemoryCacheSetType, MemoryCacheTTL, MemoryCacheValeuArgument } from './types';

@Injectable()
export class MemoryCacheService implements Partial<ICacheAdapter<NodeCache>> {
  client!: NodeCache;

  constructor(private readonly logger: ILoggerAdapter) {}

  connect(config?: NodeCache.Options): NodeCache {
    this.client = new NodeCache(config || { stdTTL: 3600, checkperiod: 3600 });
    this.logger.log('CacheMemory connected!');
    return this.client;
  }

  isConnected(): void {
    if (!this.client) this.throwException('redis disconnected.');
  }

  mSet<TSet extends MemoryCacheSetType = MemoryCacheSetType>(model: TSet[]): boolean {
    return this.client.mset(model);
  }

  mGet(key: string[]): unknown {
    return this.client.mget(key);
  }

  has(key: string | number): boolean {
    return this.client.has(key);
  }

  set<TKey = MemoryCacheKeyArgument, TValeu = MemoryCacheValeuArgument, TConf = MemoryCacheTTL>(
    key: TKey,
    value: TValeu,
    config?: TConf
  ): void {
    const setResult = this.client.set(key as MemoryCacheKeyArgument, value, config as MemoryCacheTTL);
    if (!setResult) this.throwException(`cache ${this.set.name} error: ${key} ${value}`);
  }

  del<TKey = MemoryCacheKeyArgument>(key: TKey): boolean {
    return !!this.client.del(key as MemoryCacheKeyArgument);
  }

  get<TKey = MemoryCacheKeyArgument>(key: TKey): string {
    return this.client.get(key as MemoryCacheKeyArgument);
  }

  pExpire<TCache = MemoryCacheKeyArgument>(key: TCache, ttl: number): boolean {
    return this.client.ttl(key as MemoryCacheKeyArgument, ttl);
  }

  private throwException(error: string) {
    throw new ApiInternalServerException(error);
  }
}
