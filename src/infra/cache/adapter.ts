import { MemoryCacheSetType } from './memory';

export abstract class ICacheAdapter<T = object> {
  client: T;

  abstract isConnected(): Promise<void> | void;

  abstract connect(): Promise<T> | T;

  abstract set<TKey, TValue, TConf>(key: TKey, value: TValue, config?: TConf): Promise<void> | void;

  abstract del<TKey>(key: TKey): Promise<void> | boolean;

  abstract get<TKey>(key: TKey): Promise<string> | string;

  abstract setMulti(redisList?: unknown[]): Promise<void>;

  abstract pExpire<PCache>(key: PCache, milliseconds: number): Promise<void> | boolean;

  abstract hGet<TKey, TArs>(key?: TKey, field?: TArs): Promise<unknown | unknown[]> | void;

  abstract hSet<TKey, TArgs, TValue>(key?: TKey, field?: TArgs, value?: TValue): Promise<number> | void;

  abstract hGetAll<TKey>(key: TKey): Promise<unknown | unknown[]> | void;

  abstract mSet<TSet extends MemoryCacheSetType = MemoryCacheSetType>(model?: TSet[]): boolean;

  abstract mGet(key?: string[]): unknown | null;

  abstract has(key?: string | number): boolean;
}
