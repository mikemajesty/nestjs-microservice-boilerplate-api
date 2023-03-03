export type CacheKeyArgument = string | Buffer;
export type CacheValeuArgument = string | Buffer;

export type CacheKeyValue = {
  key: CacheKeyArgument;
  value: CacheValeuArgument | CacheValeuArgument[];
};
