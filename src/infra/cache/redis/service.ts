import { Injectable } from '@nestjs/common'
import Redis, { ChainableCommander } from 'ioredis'

import { ErrorType, ILoggerAdapter } from '@/infra/logger'
import { WithErrorContext } from '@/utils/decorators'
import { ApiInternalServerException } from '@/utils/exception'
import { AnyType } from '@/utils/types'
import { InputValidator } from '@/utils/validator'

import { ICacheAdapter } from '../adapter'
import { CacheEvalInput, CacheKeyArgument, CacheKeyValue, CacheSetConfigInput, CacheSetNXInput } from '../types'
import { CacheRedisKeyArgument, CacheRedisSetConfigInput, CacheRedisValueArgument } from './types'

export const CacheSetNXInputSchema = InputValidator.object({
  key: InputValidator.string(),
  value: InputValidator.string(),
  ttlSeconds: InputValidator.number().positive()
})

@Injectable()
export class CacheRedisService implements Omit<ICacheAdapter<Redis>, 'mSet' | 'mGet'> {
  client!: Redis

  constructor(
    private readonly logger: ILoggerAdapter,
    client: Redis
  ) {
    this.client = client
  }

  async set<
    TKey extends CacheRedisKeyArgument = CacheRedisKeyArgument,
    TValue extends CacheRedisValueArgument = CacheRedisValueArgument,
    TConf extends CacheSetConfigInput = CacheRedisSetConfigInput
  >(key: TKey, value: TValue, config?: TConf): Promise<void> {
    const args: (string | number)[] = []

    const options = config as CacheRedisSetConfigInput
    if (options?.EX != null) args.push('EX', options.EX)
    if (options?.PX != null) args.push('PX', options.PX)
    if (options?.NX) args.push('NX')
    if (options?.XX) args.push('XX')

    await this.client.call('SET', key as CacheRedisKeyArgument, value as CacheRedisValueArgument, ...args)
  }

  async ping(): Promise<string> {
    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new ApiInternalServerException('Redis ping timeout')), 2000)
      )
      const ping = this.client.ping()
      const result = await Promise.race([ping, timeout])
      return result as string
    } catch (error) {
      if (typeof error === 'string') {
        const wrappedError = new ApiInternalServerException(error)
        this.logger.error({ ...(wrappedError as object), context: `${CacheRedisService.name}.ping` } as ErrorType)
        return 'DOWN'
      }
      this.logger.error({ ...(error as object), context: `${CacheRedisService.name}.ping` } as ErrorType)
      return 'DOWN'
    }
  }

  @WithErrorContext()
  async connect(): Promise<Redis> {
    if (this.client.status !== 'ready') {
      await new Promise<void>((resolve, reject) => {
        this.client.once('ready', resolve)
        this.client.once('error', reject)
      })
    }
    this.logger.log('🎯 redis connected!\n')
    return this.client
  }

  async get<TKey = CacheRedisKeyArgument>(key: TKey): Promise<string | null> {
    return await this.client.get(key as CacheRedisKeyArgument)
  }

  async del(key: CacheKeyArgument | CacheKeyArgument[]): Promise<void> {
    if (Array.isArray(key)) {
      if (key.length === 0) return

      await this.client.del(...key)
      return
    }

    await this.client.del(key)
  }

  async multiExec(commands: Array<[string, ...AnyType[]]>): Promise<void> {
    if (!commands?.length) return

    const multi: ChainableCommander = this.client.multi()

    for (const command of commands) {
      multi.call(...command)
    }

    const results = await multi.exec()

    if (!results) {
      throw new ApiInternalServerException('Cache multiExec aborted')
    }

    for (const [err, result] of results) {
      if (err) {
        throw new ApiInternalServerException('Cache multiExec command failed', {
          metadata: { error: err, result }
        })
      }
    }
  }

  async setMulti(redisList: CacheKeyValue[]): Promise<void> {
    const multi: ChainableCommander = this.client.multi()

    for (const model of redisList) {
      multi.rpush(model.key, model.value as CacheRedisValueArgument)
    }

    await multi.exec()
  }

  async pExpire(key: CacheKeyArgument, milliseconds: number): Promise<void> {
    await this.client.pexpire(key, milliseconds)
  }

  async hGet<TKey = CacheRedisKeyArgument, TArs = CacheRedisKeyArgument>(
    key: TKey,
    field: TArs
  ): Promise<unknown | unknown[]> {
    return await this.client.hget(key as string, field as string)
  }

  async hSet<TKey = CacheRedisKeyArgument, TField = CacheRedisKeyArgument, TValue = CacheRedisValueArgument>(
    key: TKey,
    field: TField,
    value: TValue
  ): Promise<number> {
    return await this.client.hset(key as string, field as string, value as CacheRedisValueArgument)
  }

  async hGetAll(key: CacheKeyArgument): Promise<unknown | unknown[]> {
    return await this.client.hgetall(key)
  }

  async has(key: string | number): Promise<boolean> {
    const exists = await this.client.exists(String(key))
    return exists > 0
  }

  async setNX({ key, value, ttlSeconds }: CacheSetNXInput): Promise<boolean> {
    const result = await this.client.set(key, value, 'EX', ttlSeconds, 'NX')
    return result === 'OK'
  }

  async eval({ script, keys, args }: CacheEvalInput): Promise<unknown> {
    return await this.client.eval(script, keys.length, ...keys, ...args)
  }
}
