/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/infra/cache-aside.md
 */
import { Injectable } from '@nestjs/common'

import { ILoggerAdapter } from '@/infra/logger'
import { ApiInternalServerException } from '@/utils/exception'
import { JitterUtils } from '@/utils/jitter'
import { AnyType } from '@/utils/types'

import { ICacheAdapter } from '../adapter'
import { ICacheAsideAdapter } from './adapter'

const TAG_PREFIX = 'cache-aside:tag:'
const DEFAULT_NULL_TTL_SECONDS = 60
const NULL_SENTINEL = '__cache-aside:null__'

/**
 * Deletes all keys registered under a tag.
 *
 * Uses HKEYS + UNLINK instead of HGETALL + DEL:
 * - HKEYS returns only field names (the cache keys), not the values.
 * - UNLINK frees memory asynchronously, so a tag with many keys does not
 *   block the Redis event loop during deletion.
 *
 * Redis Lua limits the number of arguments passed to `unpack`, so keys are
 * unlinked in bounded batches.
 */
const INVALIDATE_BY_TAG_SCRIPT = `
  local keys = redis.call('HKEYS', KEYS[1])
  local batchSize = 7000
  for index = 1, #keys, batchSize do
    local batch = {}
    local last = math.min(index + batchSize - 1, #keys)
    for keyIndex = index, last do
      table.insert(batch, keys[keyIndex])
    end
    redis.call('UNLINK', unpack(batch))
  end
  redis.call('DEL', KEYS[1])
  return #keys
`

@Injectable()
export class CacheAsideService implements ICacheAsideAdapter {
  private readonly inFlight = new Map<string, Map<string, Promise<unknown>>>()

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

  async readThroughMany<T>(
    keys: string[],
    loader: CacheAsideReadThroughManyLoaderInput<T>,
    options: CacheAsideReadThroughOptionsInput
  ): Promise<(T | null)[]> {
    if (!keys.length) return []

    const result = new Map<string, T | null>()
    const missing: string[] = []

    const raw = await this.safeMGet(keys)
    this.collectFromCache(keys, raw, result, missing)

    if (missing.length) {
      this.logger.debug({
        message: `Cache MISS keys`,
        metadata: { keys: missing, count: missing.length }
      })
      const loaded = await loader(missing)

      const storeOperations: CacheAsideStoreOperation[] = []

      for (const [key, value] of loaded) {
        if (value === undefined) {
          result.set(key, null)
          continue
        }

        result.set(key, value)

        const isNull = value === null
        if (isNull && !options.cacheNullResults) continue

        const ttlSeconds = isNull ? (options.nullTtlSeconds ?? DEFAULT_NULL_TTL_SECONDS) : options.ttlSeconds
        const toStore = isNull ? NULL_SENTINEL : value

        storeOperations.push(this.createStoreOperation(key, toStore, { ...options, ttlSeconds }))
      }

      for (const key of missing) {
        if (loaded.has(key)) continue

        result.set(key, null)
        if (!options.cacheNullResults) continue

        storeOperations.push(
          this.createStoreOperation(key, NULL_SENTINEL, {
            ...options,
            ttlSeconds: options.nullTtlSeconds ?? DEFAULT_NULL_TTL_SECONDS
          })
        )
      }

      await this.storeMany(storeOperations)
    }

    return keys.map((key) => result.get(key) ?? null)
  }

  async invalidate(key: string): Promise<void> {
    await this.invalidateMany([key])
  }

  async invalidateMany(keys: string[]): Promise<void> {
    if (!keys?.length) return

    try {
      await this.cache.del(keys)

      this.logger.debug({
        message: `Cache INVALIDATE keys`,
        metadata: { keys, count: keys.length }
      })
    } catch (error) {
      this.logger.error(
        new ApiInternalServerException(`Error invalidating cache keys`, {
          metadata: { keys, cause: error }
        })
      )
    }
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
        message: `Cache INVALIDATE tag "${tag}"`,
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

  private async safeMGet(keys: string[]): Promise<(string | null)[]> {
    try {
      return await this.cache.mGet(keys)
    } catch (error) {
      this.logger.error(
        new ApiInternalServerException(`Error fetching multiple cache keys`, {
          metadata: { keys, cause: error }
        })
      )

      return keys.map(() => null)
    }
  }

  private collectFromCache<T>(
    keys: string[],
    raw: (string | null)[],
    result: Map<string, T | null>,
    missing: string[]
  ): void {
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const value = raw[i]

      if (value === undefined || value === null) {
        missing.push(key)
        continue
      }

      if (value === JSON.stringify(NULL_SENTINEL)) {
        result.set(key, null)
        continue
      }

      const parsed = this.parse<T>(key, value)

      if (parsed === undefined) {
        missing.push(key)
        continue
      }

      result.set(key, parsed)
    }
  }

  private async getOrCreateInFlight<T>(
    key: string,
    loader: () => Promise<T> | T,
    options: CacheAsideSingleFlightOptionsInput
  ): Promise<T> {
    const optionsKey = this.getSingleFlightOptionsKey(options)
    const inFlightByOptions = this.inFlight.get(key) ?? new Map<string, Promise<unknown>>()
    const existing = inFlightByOptions.get(optionsKey)

    if (existing) {
      return existing as Promise<T>
    }

    this.inFlight.set(key, inFlightByOptions)

    const promise = this.loadAndStore(key, loader, options).finally(() => {
      const currentInFlightByOptions = this.inFlight.get(key)
      currentInFlightByOptions?.delete(optionsKey)

      if (!currentInFlightByOptions?.size) {
        this.inFlight.delete(key)
      }
    })

    inFlightByOptions.set(optionsKey, promise)

    return promise
  }

  private getSingleFlightOptionsKey(options: CacheAsideSingleFlightOptionsInput): string {
    const cacheNullResults = options.cacheNullResults ?? false
    const metadata = {
      ttlSeconds: options.ttlSeconds,
      cacheNullResults,
      nullTtlSeconds: cacheNullResults ? (options.nullTtlSeconds ?? DEFAULT_NULL_TTL_SECONDS) : undefined,
      tagCount: options.tags?.length ?? 0
    }

    try {
      const optionsKey = JSON.stringify([
        options.ttlSeconds,
        cacheNullResults,
        cacheNullResults ? (options.nullTtlSeconds ?? DEFAULT_NULL_TTL_SECONDS) : null,
        options.tags?.map(({ key, ttlSeconds }) => [key, ttlSeconds]) ?? []
      ])

      if (optionsKey === undefined) {
        throw new Error('JSON.stringify returned undefined')
      }

      return optionsKey
    } catch (error) {
      throw new ApiInternalServerException('Unable to serialize cache options for single-flight coordination', {
        context: `${CacheAsideService.name}.getSingleFlightOptionsKey`,
        details: ['Cache options could not be serialized to coordinate concurrent requests'],
        metadata,
        cause: error
      })
    }
  }

  private async loadAndStore<T>(
    key: string,
    loader: () => Promise<T> | T,
    options: CacheAsideReadThroughOptionsInput
  ): Promise<T> {
    const value = await loader()

    if (value === undefined || (value === null && !options.cacheNullResults)) {
      return value
    }

    const isNull = value === null
    const toStore = isNull ? NULL_SENTINEL : value

    const ttlSeconds = isNull ? (options.nullTtlSeconds ?? DEFAULT_NULL_TTL_SECONDS) : options.ttlSeconds

    await this.storeMany([this.createStoreOperation(key, toStore, { ...options, ttlSeconds })])

    return value
  }

  private createStoreOperation<T>(
    key: string,
    value: T,
    options: CacheAsideReadThroughOptionsInput & { ttlSeconds: number }
  ): CacheAsideStoreOperation {
    const isNull = value === NULL_SENTINEL

    const ttlSecondsWithJitter = JitterUtils.applyTtl(options.ttlSeconds)
    const ttlMs = ttlSecondsWithJitter * 1000

    const commands: Array<[string, ...AnyType[]]> = [['set', key, JSON.stringify(value), 'PX', ttlMs]]

    if (options?.tags?.length) {
      for (const tag of options.tags) {
        const tagKey = `${TAG_PREFIX}${tag.key}`

        const tagTtlSeconds = Math.min(JitterUtils.applyTtl(tag.ttlSeconds), ttlSecondsWithJitter)

        commands.push(['hSet', tagKey, key, '1'])
        commands.push(['pExpire', tagKey, tagTtlSeconds * 1000])
      }
    }

    return {
      commands,
      key,
      metadata: {
        isNull,
        key,
        tags: options?.tags,
        ttlSeconds: ttlSecondsWithJitter
      }
    }
  }

  private async storeMany(operations: CacheAsideStoreOperation[]): Promise<void> {
    if (!operations.length) return

    try {
      await this.cache.multiExec(operations.flatMap((operation) => operation.commands))

      for (const operation of operations) {
        this.logger.debug({
          message: `Cache SET for key "${operation.key}"`,
          metadata: operation.metadata
        })
      }
    } catch (error) {
      this.logger.error(
        new ApiInternalServerException(`Error writing cache keys`, {
          metadata: { keys: operations.map((operation) => operation.key), cause: error }
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

      // The null sentinel is stored as a JSON-encoded string. Matching the raw
      // value before parsing avoids a SyntaxError from JSON.parse on the sentinel
      // itself (which is not valid JSON without quotes). Note: this does not
      // disambiguate a real payload equal to the sentinel string — that edge
      // case is accepted as theoretical.
      if (cached === JSON.stringify(NULL_SENTINEL)) {
        this.logger.debug({
          message: `Cache HIT (null) for key "${key}"`,
          metadata: { key }
        })

        return null as T
      }

      const parsed = this.parse<T>(key, cached)

      if (parsed === undefined) {
        return undefined
      }

      this.logger.debug({
        message: `Cache HIT for key "${key}"`,
        metadata: { key }
      })

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
  /**
   * Whether to cache `null` results and missing keys from `readThroughMany`.
   * Default: false.
   */
  cacheNullResults?: boolean
  /**
   * Lifetime of the cached null value (in seconds).
   * Default: 60s.
   */
  nullTtlSeconds?: number
  tags?: { key: string; ttlSeconds: number }[]
}

export type CacheAsideSingleFlightOptionsInput = CacheAsideReadThroughOptionsInput

/**
 * Loader for `readThroughMany`.
 *
 * Receives the keys that missed the cache. Must return a Map with the
 * values it found, keyed by the *full cache key* (not the raw id).
 *
 * Keys not present in the returned Map are treated as "not found" and returned
 * as `null`. When `cacheNullResults` is enabled, they are cached using
 * `nullTtlSeconds` (60 seconds by default).
 */
export type CacheAsideReadThroughManyLoaderInput<T> = (
  missingKeys: string[]
) => Promise<Map<string, T>> | Map<string, T>

type CacheAsideStoreOperation = {
  commands: Array<[string, ...AnyType[]]>
  key: string
  metadata: {
    isNull: boolean
    key: string
    tags: CacheAsideReadThroughOptionsInput['tags']
    ttlSeconds: number
  }
}
