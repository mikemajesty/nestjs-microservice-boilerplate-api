export type CacheKeyArgument = string | Buffer;
export type CacheValueArgument = string | Buffer;

export type CacheKeyValue = {
  key: CacheKeyArgument;
  value: CacheValueArgument | CacheValueArgument[];
};
