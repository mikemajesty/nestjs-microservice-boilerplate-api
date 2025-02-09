import { MemoryCacheSetType } from './memory/types';
import { RedisCacheKeyArgument, RedisCacheKeyValue, RedisCacheValueArgument } from './redis/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class ICacheAdapter<T = any> {
  client!: T;

  abstract ping(): Promise<string>;

  abstract connect(): Promise<T> | T;

  abstract set<
    TKey extends RedisCacheKeyArgument = RedisCacheKeyArgument,
    TValue extends RedisCacheValueArgument = RedisCacheValueArgument,
    TConf extends object = object
  >(key: TKey, value: TValue, config?: TConf): Promise<void> | void;

  abstract del<TKey extends RedisCacheKeyArgument = RedisCacheKeyArgument>(key: TKey): Promise<void> | boolean;

  abstract get<TKey extends RedisCacheKeyArgument = RedisCacheKeyArgument>(key: TKey): Promise<string | null> | string;

  abstract setMulti(redisList?: RedisCacheKeyValue[]): Promise<void>;

  abstract pExpire<PCache extends RedisCacheKeyArgument = RedisCacheKeyArgument>(
    key: PCache,
    milliseconds: number
  ): Promise<void> | boolean;

  abstract hGet<
    TKey extends RedisCacheKeyArgument = RedisCacheKeyArgument,
    TArs extends RedisCacheKeyArgument = RedisCacheKeyArgument
  >(key?: TKey, field?: TArs): Promise<unknown | unknown[]> | void;

  abstract hSet<
    TKey extends RedisCacheKeyArgument = RedisCacheKeyArgument,
    TArgs extends RedisCacheKeyArgument = RedisCacheKeyArgument,
    TValue extends RedisCacheValueArgument = RedisCacheValueArgument
  >(key?: TKey, field?: TArgs, value?: TValue): Promise<number> | void;

  abstract hGetAll<TKey extends RedisCacheKeyArgument = RedisCacheKeyArgument>(
    key: TKey
  ): Promise<unknown | unknown[]> | void;

  abstract mSet<TSet extends MemoryCacheSetType = MemoryCacheSetType>(model?: TSet[]): boolean;

  abstract mGet(key?: string[]): unknown | null;

  abstract has(key?: string | number): boolean;
}
