export type RedisCacheKeyArgument = string | Buffer;
export type RedisCacheValeuArgument = string | Buffer;

export type RedisCacheKeyValue = {
  key: RedisCacheKeyArgument;
  value: RedisCacheValeuArgument | RedisCacheValeuArgument[];
};
