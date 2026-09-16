import { Injectable } from '@nestjs/common'

import { ILoggerAdapter } from '@/infra/logger'
import { ApiInternalServerException } from '@/utils/exception'
import { JitterUtils } from '@/utils/jitter'
import { AnyType } from '@/utils/types'

import { ICacheAdapter } from '../adapter'
import { ICacheAsideAdapter } from './adapter'

const TAG_PREFIX = 'cache-aside:tag:'
const NULL_TTL_SECONDS = 30
const NULL_SENTINEL = '__cache-aside:null__'

const INVALIDATE_BY_TAG_SCRIPT = `
  local keys = redis.call('HGETALL', KEYS[1])
  local deleted = 0
  for i = 1, #keys, 2 do
    redis.call('DEL', keys[i])
    deleted = deleted + 1
  end
  redis.call('DEL', KEYS[1])
  return deleted
`

@Injectable()
export class CacheAsideService implements ICacheAsideAdapter {
  private readonly inFlight = new Map<string, Promise<unknown>>()

  constructor(
    private readonly logger: ILoggerAdapter,
    private readonly cache: ICacheAdapter
  ) {}

  async readThrough<T>(
    key: string,
    loader: () => Promise<T> | T,
    options: CacheAsideReadThroughOptionsInput
  ): Promise<T> {
    const cached = await this.tryGetFromCache<T>(key)

    if (cached !== undefined) {
      return cached
    }

    return this.loadAndStore(key, loader, options)
  }

  async readThroughSingleFlight<T>(
    key: string,
    loader: () => Promise<T> | T,
    options: CacheAsideSingleFlightOptionsInput
  ): Promise<T> {
    const cached = await this.tryGetFromCache<T>(key)

    if (cached !== undefined) {
      return cached
    }

    return this.getOrCreateInFlight(key, loader, options)
  }

  async invalidate(key: string | string[]): Promise<void> {
    try {
      await this.cache.del(key)

      this.logger.debug({
        message: `Cache INVALIDATE key "${key}"`,
        metadata: {
          key,
          count: Array.isArray(key) ? key.length : 1
        }
      })
    } catch (error) {
      this.logger.error(
        new ApiInternalServerException(`Error invalidating cache key "${key}"`, {
          metadata: { key, cause: error }
        })
      )
    }
  }

  async invalidateMany(keys: string[]): Promise<void> {
    if (!keys?.length) return

    await this.invalidate(keys)
  }

  async invalidateByTag(tag: string): Promise<void> {
    const tagKey = `${TAG_PREFIX}${tag}`

    try {
      const raw = await this.cache.eval({
        script: INVALIDATE_BY_TAG_SCRIPT,
        keys: [tagKey],
        args: []
      })

      const deleted = typeof raw === 'number' ? raw : 0

      this.logger.debug({
        message: `Cache INVALIDATE tag "${tag}" (${deleted} keys)`,
        metadata: { tag, deleted }
      })
    } catch (error) {
      this.logger.error(
        new ApiInternalServerException(`Error invalidating tag "${tag}"`, {
          metadata: { tag, cause: error }
        })
      )
    }
  }

  private async getOrCreateInFlight<T>(
    key: string,
    loader: () => Promise<T> | T,
    options: CacheAsideSingleFlightOptionsInput
  ): Promise<T> {
    const existing = this.inFlight.get(key)

    if (existing) {
      return existing as Promise<T>
    }

    const promise = this.loadAndStore(key, loader, options)

    const trackedPromise = promise.finally(() => {
      this.inFlight.delete(key)
    })

    this.inFlight.set(key, trackedPromise)

    return trackedPromise
  }

  private async loadAndStore<T>(
    key: string,
    loader: () => Promise<T> | T,
    options: CacheAsideReadThroughOptionsInput
  ): Promise<T> {
    const value = await loader()

    if (value === undefined) {
      return value
    }

    const toStore = value === null ? NULL_SENTINEL : value

    await this.store(key, toStore, options)

    return value
  }

  private async store<T>(key: string, value: T, options: CacheAsideReadThroughOptionsInput): Promise<void> {
    const isNull = value === NULL_SENTINEL

    const baseTtl = isNull ? NULL_TTL_SECONDS : options.ttlSeconds

    const ttlSecondsWithJitter = JitterUtils.applyTtl(baseTtl)
    const ttlMs = ttlSecondsWithJitter * 1000

    const commands: Array<[string, ...AnyType[]]> = [
      ['set', key, JSON.stringify(value)],
      ['pExpire', key, ttlMs]
    ]

    if (options?.tags?.length) {
      for (const tag of options.tags) {
        const tagKey = `${TAG_PREFIX}${tag.key}`
        commands.push(['hSet', tagKey, key, '1'])
        commands.push(['pExpire', tagKey, tag.ttlSeconds * 1000])
      }
    }

    try {
      await this.cache.multiExec(commands)

      this.logger.debug({
        message: `Cache SET for key "${key}" with ttl ${ttlSecondsWithJitter}s`,
        metadata: {
          key,
          ttlSeconds: ttlSecondsWithJitter,
          tags: options?.tags,
          isNull
        }
      })
    } catch (error) {
      this.logger.error(
        new ApiInternalServerException(`Error writing cache for key "${key}"`, {
          metadata: { key, cause: error }
        })
      )
    }
  }

  private async tryGetFromCache<T>(key: string): Promise<T | undefined> {
    try {
      const cached = await this.cache.get(key)

      if (cached === undefined || cached === null) {
        this.logger.debug({
          message: `Cache MISS for key "${key}"`,
          metadata: { key }
        })

        return undefined
      }

      this.logger.debug({
        message: `Cache HIT for key "${key}"`,
        metadata: { key }
      })

      const parsed = this.parse<T>(key, cached)

      if ((parsed as unknown) === NULL_SENTINEL) {
        return null as unknown as T
      }

      return parsed
    } catch (error) {
      this.logger.error(
        new ApiInternalServerException(`Error reading cache key "${key}"`, {
          metadata: { key, cause: error }
        })
      )

      return undefined
    }
  }

  private parse<T>(key: string, value: string): T | undefined {
    try {
      return JSON.parse(value) as T
    } catch (error) {
      this.logger.warn({
        message: `Failed to parse cached value for key "${key}", treating as MISS`,
        metadata: {
          key,
          cause: error
        }
      })

      return undefined
    }
  }
}

export type CacheAsideReadThroughOptionsInput = {
  ttlSeconds: number
  tags?: { key: string; ttlSeconds: number }[]
}

export type CacheAsideSingleFlightOptionsInput = CacheAsideReadThroughOptionsInput
