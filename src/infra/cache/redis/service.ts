/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/infra/cache.md
 */
import { Injectable } from '@nestjs/common'
import { RedisClientType, SetOptions } from 'redis'

import { ErrorType, ILoggerAdapter } from '@/infra/logger'
import { WithErrorContext } from '@/utils/decorators'
import { ApiInternalServerException } from '@/utils/exception'

import { ICacheAdapter } from '../adapter'
import { CacheKeyArgument, CacheKeyValue } from '../types'
import { RedisCacheKeyArgument, RedisCacheValueArgument } from './types'

@Injectable()
export class RedisService implements Partial<ICacheAdapter<RedisClientType>> {
  client!: RedisClientType

  constructor(
    private readonly logger: ILoggerAdapter,
    client: RedisClientType
  ) {
    this.client = client
  }

  async ping(): Promise<string> {
    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new ApiInternalServerException('Redis ping timeout')), 100)
      )
      const ping = this.client.ping()
      const result = await Promise.race([ping, timeout])

      return result as string
    } catch (error) {
      if (typeof error === 'string') {
        const wrappedError = new ApiInternalServerException(error)
        this.logger.error({ ...(wrappedError as object), context: `${RedisService.name}/ping` } as ErrorType)
        return 'DOWN'
      }
      this.logger.error({ ...(error as object), context: `${RedisService.name}/ping` } as ErrorType)
      return 'DOWN'
    }
  }

  @WithErrorContext()
  async connect(): Promise<RedisClientType> {
    await this.client.connect()
    this.logger.log('🎯 redis connected!\n')
    return this.client
  }

  async set<TKey = RedisCacheKeyArgument, TValue = RedisCacheValueArgument, TConf = object>(
    key: TKey,
    value: TValue,
    config?: TConf
  ): Promise<void> {
    await this.client.set(key as RedisCacheKeyArgument, value as RedisCacheValueArgument, config as SetOptions)
  }

  async get<TKey = RedisCacheKeyArgument>(key: TKey): Promise<string | null> {
    const getResult = await this.client.get(key as RedisCacheKeyArgument)

    return getResult
  }

  async del(key: CacheKeyArgument): Promise<void> {
    await this.client.del(key)
  }

  async setMulti(redisList: CacheKeyValue[]): Promise<void> {
    const multi = this.client.multi()

    for (const model of redisList) {
      multi.rPush(model.key, model.value)
    }

    await multi.exec()
  }

  async pExpire(key: CacheKeyArgument, milliseconds: number): Promise<void> {
    await this.client.pExpire(key, milliseconds)
  }

  async hGet<TKey = RedisCacheKeyArgument, TArs = RedisCacheKeyArgument>(
    key: TKey,
    field: TArs
  ): Promise<unknown | unknown[]> {
    return await this.client.hGet(key as RedisCacheKeyArgument, field as RedisCacheKeyArgument)
  }

  async hSet<TKey = RedisCacheKeyArgument, TField = RedisCacheKeyArgument, TValue = RedisCacheValueArgument>(
    key: TKey,
    field: TField,
    value: TValue
  ): Promise<number> {
    return await this.client.hSet(
      key as RedisCacheKeyArgument,
      field as RedisCacheKeyArgument,
      value as RedisCacheValueArgument
    )
  }

  async hGetAll(key: CacheKeyArgument): Promise<unknown | unknown[]> {
    return await this.client.hGetAll(key)
  }
}
