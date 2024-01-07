export type MemoryCacheKeyArgument = string | number;
export type MemoryCacheValueArgument = number | string | Buffer;
export type MemoryCacheTTL = number | string;

export type MemoryCacheSetType = {
  key: string;
  val: unknown;
  ttl?: number;
};
