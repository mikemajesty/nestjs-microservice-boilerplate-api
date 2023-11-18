import { CreatedModel, CreatedOrUpdateModel, DatabaseOperationCommand, RemovedModel, UpdatedModel } from './types';

export abstract class IRepository<T> {
  abstract create<TOptions = unknown>(document: T, saveOptions?: TOptions): Promise<CreatedModel>;

  abstract createOrUpdate<TUpdate = Partial<T>, TOptions = unknown>(
    updated: TUpdate,
    options?: TOptions
  ): Promise<CreatedOrUpdateModel>;

  abstract insertMany<TOptions = unknown>(document: T[], saveOptions?: TOptions): Promise<void>;

  abstract findById<TOpt = unknown>(id: string | number, options?: TOpt): Promise<T>;

  abstract findAll<TQuery = Partial<T>, TOpt = unknown>(filter?: TQuery, opt?: TOpt): Promise<T[]>;

  abstract find<TQuery = Partial<T>, TOptions = unknown>(filter: TQuery, options?: TOptions | null): Promise<T[]>;

  abstract findIn<TOptions = unknown>(
    filter: { [key in keyof Partial<T>]: string[] },
    options?: TOptions | null
  ): Promise<T[]>;

  abstract findByCommands<TOptions = unknown>(
    filterList: DatabaseOperationCommand<T>[],
    options?: TOptions | null
  ): Promise<T[]>;

  abstract remove<TQuery = Partial<T>, TOpt = unknown>(filter: TQuery, opt?: TOpt): Promise<RemovedModel>;

  abstract findOne<TQuery = Partial<T>, TOptions = unknown>(filter: TQuery, options?: TOptions): Promise<T>;

  abstract updateOne<TQuery = Partial<T>, TUpdate = Partial<T>, TOptions = unknown>(
    filter: TQuery,
    updated: TUpdate,
    options?: TOptions
  ): Promise<UpdatedModel>;

  abstract findOneAndUpdate<TQuery = Partial<T>, TUpdate = Partial<T>, TOptions = unknown>(
    filter: TQuery,
    updated: TUpdate,
    options?: TOptions
  ): Promise<T>;

  abstract updateMany<TQuery = Partial<T>, TUpdate = Partial<T>, TOptions = unknown>(
    filter: TQuery,
    updated: TUpdate,
    options?: TOptions
  ): Promise<UpdatedModel>;

  abstract findOneWithExcludeFields<TQuery = Partial<T>, TOptions = unknown>(
    filter: TQuery,
    excludeProperties: Array<keyof T>,
    options?: TOptions
  ): Promise<T>;

  abstract findAllWithExcludeFields<TQuery = Partial<T>, TOptions = unknown>(
    excludeProperties: Array<keyof T>,
    filter?: TQuery | null,
    options?: TOptions
  ): Promise<T[]>;

  abstract findOneWithSelectFields<TQuery = Partial<T>, TOptions = unknown>(
    filter: TQuery,
    includeProperties: Array<keyof T>,
    options?: TOptions
  ): Promise<T>;

  abstract findAllWithSelectFields<TQuery = Partial<T>, TOptions = unknown>(
    includeProperties: Array<keyof T>,
    filter?: TQuery | null,
    options?: TOptions
  ): Promise<T[]>;

  abstract seed<TOpt = unknown>(entityList: T[], options?: TOpt): Promise<void>;
}
