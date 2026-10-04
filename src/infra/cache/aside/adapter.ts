/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/infra/cache-aside.md
 */
import { AnyType } from '@/utils/types'

import {
  CacheAsideReadThroughManyLoaderInput,
  CacheAsideReadThroughOptionsInput,
  CacheAsideSingleFlightOptionsInput
} from './service'

export abstract class ICacheAsideAdapter {
  /**
   * Read-through cache lookup.
   *
   * Returns the cached value if present. On a MISS, runs the `loader`,
   * stores the result in cache, and returns it.
   *
   * No coordination between concurrent requests or application replicas:
   * every MISS triggers its own `loader` execution. Use
   * `readThroughSingleFlight` when concurrent calls for the same key
   * are expected and the `loader` is expensive.
   */
  abstract readThrough<T = AnyType>(
    key: string,
    loader: () => Promise<T> | T,
    options: CacheAsideReadThroughOptionsInput
  ): Promise<T>

  /**
   * Read-through cache lookup for multiple keys.
   *
   * Returns the cached values if present. On a MISS, runs the `loader`
   * for the missing keys, stores the results in cache, and returns them.
   *
   * The returned array maintains the order of the input keys, with `null`
   * for any key that could not be loaded.
   */
  abstract readThroughMany<T>(
    keys: string[],
    loader: CacheAsideReadThroughManyLoaderInput<T>,
    options: CacheAsideReadThroughOptionsInput
  ): Promise<(T | null)[]>

  /**
   * Read-through cache lookup with single-flight protection.
   *
   * Returns the cached value if present. On a MISS, concurrent calls for
   * the same key within the same application instance share a single
   * `loader` execution; the remaining callers await its result.
   *
   * The single-flight coordination is **local to the instance** and is not
   * distributed across replicas. Each replica may still run the `loader`
   * once in parallel for the same key. This is a deliberate trade-off to
   * avoid the complexity and failure modes of a distributed lock.
   */
  abstract readThroughSingleFlight<T = AnyType>(
    key: string,
    loader: () => Promise<T> | T,
    options: CacheAsideSingleFlightOptionsInput
  ): Promise<T>

  /**
   * Invalidates a single cache key.
   *
   * Failures are logged and swallowed: cache invalidation must never break
   * the caller's flow.
   */
  abstract invalidate(key: string): Promise<void>

  /**
   * Invalidates multiple cache keys in a single operation.
   *
   * No-op when the provided list is empty. Failures are logged and
   * swallowed, consistent with `invalidate`.
   */
  abstract invalidateMany(keys: string[]): Promise<void>

  /**
   * Invalidates every cache key associated with the given tag.
   *
   * Implementations should treat this as a single atomic operation so that
   * keys written concurrently cannot become untracked by the tag. Failures
   * are logged and swallowed.
   */
  abstract invalidateByTag(tag: string): Promise<void>
}
