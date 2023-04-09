import { QueryOptions, SaveOptions, UpdateQuery, UpdateWithAggregationPipeline } from 'mongoose';

import { CreatedModel, RemovedModel, UpdatedModel } from './types';

export abstract class IRepository<T> {
  abstract isConnected(): Promise<boolean> | boolean;

  abstract create<TOptions = SaveOptions>(document: T, saveOptions?: TOptions): Promise<CreatedModel>;

  abstract findById(id: string | number): Promise<T>;

  abstract findAll<TQuery = Partial<T>>(filter?: TQuery): Promise<T[]>;

  abstract find<TQuery = Partial<T>, TOptions = QueryOptions<T>>(
    filter: TQuery,
    options?: TOptions | null
  ): Promise<T[]>;

  abstract remove<TQuery = Partial<T>>(filter: TQuery): Promise<RemovedModel>;

  abstract findOne<TQuery = Partial<T>, TOptions = QueryOptions<T>>(filter: TQuery, options?: TOptions): Promise<T>;

  abstract updateOne<
    TQuery = Partial<T>,
    TUpdate = UpdateQuery<T> | UpdateWithAggregationPipeline,
    TOptions = QueryOptions<T>
  >(filter: TQuery, updated: TUpdate, options?: TOptions): Promise<UpdatedModel>;

  abstract updateMany<
    TQuery = Partial<T>,
    TUpdate = UpdateQuery<T> | UpdateWithAggregationPipeline,
    TOptions = QueryOptions<T>
  >(filter: TQuery, updated: TUpdate, options?: TOptions): Promise<UpdatedModel>;

  abstract seed(entityList: T[]): Promise<void>;
}
