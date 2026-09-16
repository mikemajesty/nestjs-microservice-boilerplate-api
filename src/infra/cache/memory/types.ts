export type CacheMemoryKeyArgument = string | number
export type CacheMemoryValueArgument = number | string | Buffer

export type CacheMemorySetType = {
  key: string
  val: unknown
  ttl?: number
}

/**
 * Memory cache set configuration input
 */
export type CacheMemorySetConfigInput = {
  /**
   * Time to live in seconds only on memory cache
   */
  ttlSeconds?: number
}
