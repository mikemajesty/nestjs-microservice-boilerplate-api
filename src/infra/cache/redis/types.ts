export type RedisCacheKeyArgument = string | Buffer;
export type RedisCacheValueArgument = string | Buffer;

export type RedisCacheKeyValue = {
  key: RedisCacheKeyArgument;
  value: RedisCacheValueArgument | RedisCacheValueArgument[];
};
