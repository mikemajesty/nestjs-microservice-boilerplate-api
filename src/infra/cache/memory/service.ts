/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/infra/cache.md
 */
import { Injectable } from '@nestjs/common'
import NodeCache from 'node-cache'

import { ILoggerAdapter } from '@/infra/logger'

import { ICacheAdapter } from '../adapter'
import { CacheSetConfigInput } from '../types'
import {
  CacheMemoryKeyArgument,
  CacheMemorySetConfigInput,
  CacheMemorySetType,
  CacheMemoryValueArgument
} from './types'

@Injectable()
export class CacheMemoryService implements Omit<
  ICacheAdapter<NodeCache>,
  'hGet' | 'hSet' | 'hGetAll' | 'setMulti' | 'ping' | 'setNX' | 'eval' | 'multiExec'
> {
  client!: NodeCache

  constructor(private readonly logger: ILoggerAdapter) {}

  connect(config?: NodeCache.Options): NodeCache {
    this.client = new NodeCache(config || { stdTTL: 3600, checkperiod: 3600 })
    this.logger.log('🎯 cacheMemory connected!')
    return this.client
  }

  mSet<TSet extends CacheMemorySetType = CacheMemorySetType>(model: TSet[]): boolean {
    return this.client.mset(model)
  }

  mGet(key: string[]): unknown {
    return this.client.mget(key)
  }

  has(key: string | number): boolean {
    return this.client.has(key)
  }

  set<
    TKey = CacheMemoryKeyArgument,
    TValue = CacheMemoryValueArgument,
    TConf extends CacheSetConfigInput = CacheMemorySetConfigInput
  >(key: TKey, value: TValue, config?: TConf): void {
    const options = config as CacheMemorySetConfigInput
    this.client.set(key as CacheMemoryKeyArgument, value, options?.ttlSeconds as number)
  }

  del<TKey = CacheMemoryKeyArgument | CacheMemoryKeyArgument[]>(key: TKey | TKey[]): boolean {
    if (Array.isArray(key)) {
      if (key.length === 0) return false

      return !!this.client.del(key as CacheMemoryKeyArgument[])
    }

    return !!this.client.del(key as CacheMemoryKeyArgument)
  }

  get<TKey = CacheMemoryKeyArgument>(key: TKey): string {
    return this.client.get(key as CacheMemoryKeyArgument) as string
  }

  pExpire<TCache = CacheMemoryKeyArgument>(key: TCache, ttl: number): boolean {
    return this.client.ttl(key as CacheMemoryKeyArgument, ttl)
  }
}
