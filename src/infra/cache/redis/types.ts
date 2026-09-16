export type CacheRedisKeyArgument = string | Buffer
export type CacheRedisValueArgument = string | Buffer
export type CacheRedisKeyValue = {
  key: CacheRedisKeyArgument
  value: CacheRedisValueArgument | CacheRedisValueArgument[]
}

export type CacheRedisArgument = string | Buffer | number

/**
 * Redis cache set configuration input
 */
export type CacheRedisSetConfigInput = {
  EX?: number
  PX?: number
  NX?: boolean
  XX?: boolean
  GET?: boolean
}
