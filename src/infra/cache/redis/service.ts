/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/infra/cache.md
 */
import { Injectable } from '@nestjs/common'
import { ISetOptions, RedisService as RedisXService } from '@nestjs-redisx/core'
import { SetOptions } from 'redis'

import { ErrorType, ILoggerAdapter } from '@/infra/logger'
import { ApiInternalServerException } from '@/utils/exception'

import { ICacheAdapter } from '../adapter'
import { CacheKeyArgument, CacheKeyValue } from '../types'
import { RedisCacheKeyArgument, RedisCacheValueArgument } from './types'

/**
 * Translates the node-redis `SetOptions` already used across the codebase into
 * the driver-agnostic options accepted by RedisX, so callers keep writing
 * `{ PX: 1000 }` and expiration keeps working.
 */
const toSetOptions = (config?: object): ISetOptions | undefined => {
  if (!config) {
    return undefined
  }

  const { EX, PX, EXAT, PXAT, NX, XX, GET, KEEPTTL } = config as SetOptions

  return {
    ...(EX !== undefined && { ex: Number(EX) }),
    ...(PX !== undefined && { px: Number(PX) }),
    ...(EXAT !== undefined && { exat: Number(EXAT) }),
    ...(PXAT !== undefined && { pxat: Number(PXAT) }),
    ...(NX !== undefined && { nx: NX }),
    ...(XX !== undefined && { xx: XX }),
    ...(GET !== undefined && { get: GET }),
    ...(KEEPTTL !== undefined && { keepttl: KEEPTTL })
  }
}

@Injectable()
export class RedisService implements Partial<ICacheAdapter<RedisXService>> {
  client!: RedisXService

  constructor(
    private readonly logger: ILoggerAdapter,
    client: RedisXService
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
        error = new ApiInternalServerException(error)
      }
      ;(error as { context: string }).context = `${RedisService.name}/ping`
      this.logger.error(error as ErrorType)
      return 'DOWN'
    }
  }

  async connect(): Promise<RedisXService> {
    try {
      await this.client.ping()
      this.logger.log('🎯 redis connected!\n')
      return this.client
    } catch (error) {
      throw new ApiInternalServerException((error as { message: string }).message, {
        context: `${RedisService.name}/connect`
      })
    }
  }

  async set<TKey = RedisCacheKeyArgument, TValue = RedisCacheValueArgument, TConf = object>(
    key: TKey,
    value: TValue,
    config?: TConf
  ): Promise<void> {
    await this.client.set(String(key), String(value), toSetOptions(config as object))
  }

  async get<TKey = RedisCacheKeyArgument>(key: TKey): Promise<string | null> {
    const getResult = await this.client.get(String(key))

    return getResult
  }

  async del(key: CacheKeyArgument): Promise<void> {
    await this.client.del(String(key))
  }

  async setMulti(redisList: CacheKeyValue[]): Promise<void> {
    const multi = await this.client.multi()

    for (const model of redisList) {
      const values = Array.isArray(model.value) ? model.value : [model.value]
      multi.rpush(String(model.key), ...values.map(String))
    }

    await multi.exec()
  }

  async pExpire(key: CacheKeyArgument, milliseconds: number): Promise<void> {
    await this.client.pexpire(String(key), milliseconds)
  }

  async hGet<TKey = RedisCacheKeyArgument, TArs = RedisCacheKeyArgument>(
    key: TKey,
    field: TArs
  ): Promise<unknown | unknown[]> {
    return await this.client.hget(String(key), String(field))
  }

  async hSet<TKey = RedisCacheKeyArgument, TField = RedisCacheKeyArgument, TValue = RedisCacheValueArgument>(
    key: TKey,
    field: TField,
    value: TValue
  ): Promise<number> {
    return await this.client.hset(String(key), String(field), String(value))
  }

  async hGetAll(key: CacheKeyArgument): Promise<unknown | unknown[]> {
    return await this.client.hgetall(String(key))
  }
}
