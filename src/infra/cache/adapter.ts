/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/infra/cache.md
 */
import { AnyType } from '@/utils/types'

import { CacheMemorySetType } from './memory/types'
import { CacheRedisKeyArgument, CacheRedisKeyValue, CacheRedisValueArgument } from './redis/types'
import { CacheEvalInput, CacheSetConfigInput, CacheSetNXInput } from './types'

export abstract class ICacheAdapter<T = AnyType> {
  client!: T

  abstract ping(): Promise<string>

  abstract connect(): Promise<T> | T

  abstract getTtl(key: CacheRedisKeyArgument): number | undefined | Promise<number | undefined>

  abstract set<
    TKey extends CacheRedisKeyArgument = CacheRedisKeyArgument,
    TValue extends CacheRedisValueArgument = CacheRedisValueArgument,
    TConf extends CacheSetConfigInput = CacheSetConfigInput
  >(key: TKey, value: TValue, config?: TConf): Promise<void> | void

  abstract del<TKey extends CacheRedisKeyArgument = CacheRedisKeyArgument>(key: TKey | TKey[]): Promise<void> | boolean

  abstract get<TKey extends CacheRedisKeyArgument = CacheRedisKeyArgument>(key: TKey): Promise<string | null> | string

  abstract setMulti(redisList?: CacheRedisKeyValue[]): Promise<void>

  abstract pExpire<PCache extends CacheRedisKeyArgument = CacheRedisKeyArgument>(
    key: PCache,
    milliseconds: number
  ): Promise<void> | boolean

  abstract multiExec(commands: Array<[string, ...AnyType[]]>): Promise<void>

  abstract hGet<
    TKey extends CacheRedisKeyArgument = CacheRedisKeyArgument,
    TArs extends CacheRedisKeyArgument = CacheRedisKeyArgument
  >(key?: TKey, field?: TArs): Promise<unknown | unknown[]> | void

  abstract hSet<
    TKey extends CacheRedisKeyArgument = CacheRedisKeyArgument,
    TArgs extends CacheRedisKeyArgument = CacheRedisKeyArgument,
    TValue extends CacheRedisValueArgument = CacheRedisValueArgument
  >(key?: TKey, field?: TArgs, value?: TValue): Promise<number> | void

  abstract hGetAll<TKey extends CacheRedisKeyArgument = CacheRedisKeyArgument>(
    key: TKey
  ): Promise<unknown | unknown[]> | void

  abstract mSet<TSet extends CacheMemorySetType = CacheMemorySetType>(model?: TSet[]): boolean

  abstract mGet(keys: CacheRedisKeyArgument[]): Promise<(string | null)[]> | (string | null)[]

  abstract has(key?: string | number): boolean | Promise<boolean>

  abstract setNX(input: CacheSetNXInput): Promise<boolean>

  abstract eval(input: CacheEvalInput): Promise<unknown>
}
