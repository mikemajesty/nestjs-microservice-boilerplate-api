import { CreatedModel, RemovedModel, UpdatedModel } from './types';

export abstract class IRepository<T> {
  abstract isConnected(): Promise<boolean> | boolean;

  abstract create<TOptions = unknown>(document: T, saveOptions?: TOptions): Promise<CreatedModel>;

  abstract findById<TOpt = unknown>(id: string | number, options?: TOpt): Promise<T>;

  abstract findAll<TQuery = Partial<T>, TOpt = unknown>(filter?: TQuery, opt?: TOpt): Promise<T[]>;

  abstract find<TQuery = Partial<T>, TOptions = unknown>(filter: TQuery, options?: TOptions | null): Promise<T[]>;

  abstract remove<TQuery = Partial<T>, TOpt = unknown>(filter: TQuery, opt?: TOpt): Promise<RemovedModel>;

  abstract findOne<TQuery = Partial<T>, TOptions = unknown>(filter: TQuery, options?: TOptions): Promise<T>;

  abstract updateOne<TQuery = Partial<T>, TUpdate = Partial<T>, TOptions = unknown>(
    filter: TQuery,
    updated: TUpdate,
    options?: TOptions
  ): Promise<UpdatedModel>;

  abstract updateMany<TQuery = Partial<T>, TUpdate = Partial<T>, TOptions = unknown>(
    filter: TQuery,
    updated: TUpdate,
    options?: TOptions
  ): Promise<UpdatedModel>;

  abstract seed<TOpt = unknown>(entityList: T[], options?: TOpt): Promise<void>;
}
