import {
  Document,
  FilterQuery,
  InsertManyOptions,
  Model,
  MongooseBaseQueryOptions,
  MongooseUpdateQueryOptions,
  QueryOptions,
  RootFilterQuery,
  SaveOptions,
  UpdateQuery,
  UpdateWithAggregationPipeline
} from 'mongoose';

import { ConvertMongoFilterToBaseRepository } from '@/utils/decorators';
import { IEntity } from '@/utils/entity';
import { ApiBadRequestException } from '@/utils/exception';

import { IRepository } from '../adapter';
import { CreatedModel, CreatedOrUpdateModel, DatabaseOperationCommand, RemovedModel, UpdatedModel } from '../types';
import { validateFindByCommandsFilter } from '../util';

export class MongoRepository<T extends Document> implements IRepository<T> {
  constructor(private readonly model: Model<T>) {}

  async insertMany<TOptions>(documents: T[], saveOptions?: TOptions): Promise<void> {
    await this.model.insertMany(documents, saveOptions as InsertManyOptions);
  }

  async create<TOptions>(document: T, saveOptions?: TOptions): Promise<CreatedModel> {
    const createdEntity = new this.model({ ...document, _id: document.id });
    const savedResult = await createdEntity.save(saveOptions as SaveOptions);

    return { id: savedResult.id, created: !!savedResult.id };
  }

  async createOrUpdate<TDoc = UpdateWithAggregationPipeline | UpdateQuery<T>>(
    document: TDoc,
    options?: unknown
  ): Promise<CreatedOrUpdateModel> {
    const doc = document as { id: string | number };
    if (!doc['id']) {
      throw new ApiBadRequestException('id is required');
    }

    const exists = await this.findById(doc['id']);

    if (!exists) {
      const createdEntity = new this.model({ ...document, _id: doc['id'] });
      const savedResult = await createdEntity.save(options as SaveOptions);

      return { id: savedResult.id, created: true, updated: false };
    }

    await this.model.updateOne(
      { _id: exists.id },
      { $set: document as unknown as T },
      options as MongooseUpdateQueryOptions<IEntity>
    );

    return { id: exists.id, created: false, updated: true };
  }

  @ConvertMongoFilterToBaseRepository()
  async find<TFil = RootFilterQuery<T>, TOp = QueryOptions>(filter: TFil, options?: TOp): Promise<T[]> {
    return (await this.model.find(filter as RootFilterQuery<T>, undefined, options as QueryOptions)).map((u) =>
      u.toObject({ virtuals: true })
    );
  }

  async findById(id: string | number): Promise<T | null> {
    const model = await this.model.findById(id);

    if (!model) return null;

    return model.toObject({ virtuals: true });
  }

  @ConvertMongoFilterToBaseRepository()
  async findOne<TFil = RootFilterQuery<T>, TQue = QueryOptions>(filter: TFil, options?: TQue): Promise<T | null> {
    const data = await this.model.findOne(filter as RootFilterQuery<T>, undefined, options as QueryOptions);

    if (!data) return null;

    return data.toObject({ virtuals: true });
  }

  @ConvertMongoFilterToBaseRepository()
  async findAll<TFil = FilterQuery<T>, TOpt = QueryOptions<IEntity>>(filter?: TFil, options?: TOpt): Promise<T[]> {
    const modelList = await this.model.find(filter as FilterQuery<T>, options || ({} as QueryOptions<IEntity>));

    return (modelList || []).map((u) => u.toObject({ virtuals: true }));
  }

  @ConvertMongoFilterToBaseRepository()
  async remove<TQuery = FilterQuery<T>, TOpt = unknown>(filter: TQuery, options?: TOpt): Promise<RemovedModel> {
    const { deletedCount } = await this.model.deleteOne(
      filter as FilterQuery<T>,
      (options || {}) as MongooseBaseQueryOptions
    );
    return { deletedCount, deleted: !!deletedCount };
  }

  @ConvertMongoFilterToBaseRepository()
  async updateOne<
    TQuery = FilterQuery<T>,
    TUpdate = UpdateWithAggregationPipeline | UpdateQuery<T>,
    TOptions = MongooseUpdateQueryOptions
  >(filter: TQuery, updated: TUpdate, options?: TOptions): Promise<UpdatedModel> {
    return await this.model.updateOne(
      filter as FilterQuery<T>,
      { $set: Object.assign({}, updated) },
      options as MongooseUpdateQueryOptions
    );
  }

  @ConvertMongoFilterToBaseRepository()
  async findOneAndUpdate<TQuery = FilterQuery<T>, TUpdate = UpdateWithAggregationPipeline | UpdateQuery<T>>(
    filter: TQuery,
    updated: TUpdate,
    options: unknown = {}
  ): Promise<T | null> {
    Object.assign(options as QueryOptions, { new: true });

    const model = await this.model.findOneAndUpdate(
      filter as FilterQuery<T>,
      { $set: updated as UpdateWithAggregationPipeline | UpdateQuery<T> },
      options as QueryOptions
    );

    if (!model) {
      return null;
    }

    return model.toObject({ virtuals: true });
  }

  @ConvertMongoFilterToBaseRepository()
  async updateMany<
    TQuery = FilterQuery<T>,
    TUpdate = UpdateWithAggregationPipeline | UpdateQuery<T>,
    TOptions = MongooseUpdateQueryOptions
  >(filter: TQuery, updated: TUpdate, options?: TOptions): Promise<UpdatedModel> {
    return await this.model.updateMany(
      filter as FilterQuery<T>,
      { $set: updated as UpdateWithAggregationPipeline | UpdateQuery<T> },
      options as MongooseUpdateQueryOptions
    );
  }

  async findIn<TOptions = QueryOptions>(input: { [key in keyof T]: string[] }, options?: TOptions): Promise<T[]> {
    const where: RootFilterQuery<IEntity> = {
      deletedAt: null
    };

    for (const key of Object.keys(input)) {
      where[key === 'id' ? '_id' : key] = { $in: (input as { [key: string]: unknown })[`${key}`] };
    }

    const filter = where;
    const data = await this.model.find(filter, null, options as QueryOptions);

    return data.map((d) => d.toObject({ virtuals: true }));
  }

  async findOr<TOptions = QueryOptions>(propertyList: (keyof T)[], value: string, options?: TOptions): Promise<T[]> {
    const filter = propertyList.map((key) => {
      return { [key === 'id' ? '_id' : key]: value };
    });
    const data = await this.model.find(
      { $or: filter as FilterQuery<T>[], deletedAt: null },
      null,
      options as QueryOptions
    );

    return data.map((d) => d.toObject({ virtuals: true }));
  }

  async findOneByCommands<TOptions = QueryOptions>(
    filterList: DatabaseOperationCommand<T>[],
    options?: TOptions
  ): Promise<T | null> {
    const mongoSearch = {
      equal: { type: '$in', like: false },
      not_equal: { type: '$nin', like: false },
      not_contains: { type: '$nin', like: true },
      contains: { type: '$in', like: true }
    };

    const searchList = {};

    validateFindByCommandsFilter(filterList);

    for (const filter of filterList) {
      const command = mongoSearch[filter.command];

      if (command.like) {
        Object.assign(searchList, {
          [filter.property === 'id' ? '_id' : filter.property]: {
            [command.type]: filter.value.map((value) => new RegExp(`^${value}`, 'i'))
          }
        });
        continue;
      }

      Object.assign(searchList, {
        [filter.property === 'id' ? '_id' : filter.property]: { [command.type]: filter.value }
      });
    }

    Object.assign(searchList, { deletedAt: null });

    const data = await this.model.findOne(searchList, null, options as QueryOptions);

    return data ?? null;
  }

  async findByCommands<TOptions = QueryOptions>(
    filterList: DatabaseOperationCommand<T>[],
    options?: TOptions
  ): Promise<T[]> {
    const mongoSearch = {
      equal: { type: '$in', like: false },
      not_equal: { type: '$nin', like: false },
      not_contains: { type: '$nin', like: true },
      contains: { type: '$in', like: true }
    };

    const searchList = {};

    validateFindByCommandsFilter(filterList);

    for (const filter of filterList) {
      const command = mongoSearch[filter.command];

      if (command.like) {
        Object.assign(searchList, {
          [filter.property === 'id' ? '_id' : filter.property]: {
            [command.type]: filter.value.map((value) => new RegExp(`^${value}`, 'i'))
          }
        });
        continue;
      }

      Object.assign(searchList, {
        [filter.property === 'id' ? '_id' : filter.property]: { [command.type]: filter.value }
      });
    }

    Object.assign(searchList, { deletedAt: null });

    const data = await this.model.find(searchList, null, options as QueryOptions);

    return data.map((d) => d.toObject({ virtuals: true }));
  }

  @ConvertMongoFilterToBaseRepository()
  async findOneWithExcludeFields<TQuery = FilterQuery<T>, TOptions = QueryOptions>(
    filter: TQuery,
    excludeProperties: Array<keyof T>,
    options?: TOptions
  ): Promise<T | null> {
    const exclude = excludeProperties.map((e) => `-${e.toString()}`);

    const data = await this.model
      .findOne((filter || {}) as FilterQuery<T>, undefined, options as QueryOptions)
      .select(exclude.join(' '));

    if (!data) return null;

    return data.toObject({ virtuals: true });
  }

  async findAllWithExcludeFields<TQuery = FilterQuery<T>, TOptions = QueryOptions>(
    excludeProperties: Array<keyof T>,
    filter?: TQuery,
    options?: TOptions
  ): Promise<T[]> {
    const exclude = excludeProperties.map((e) => `-${e.toString()}`);

    if (filter) {
      (filter as FilterQuery<T>) = this.applyFilterWhenFilterParameterIsNotFirstOption(filter);
    }

    const data = await this.model
      .find((filter || {}) as FilterQuery<T>, undefined, options as QueryOptions)
      .select(exclude.join(' '));

    return data.map((d) => d.toObject({ virtuals: true }));
  }

  @ConvertMongoFilterToBaseRepository()
  async findOneWithSelectFields<TQuery = FilterQuery<T>, TOptions = QueryOptions>(
    filter: TQuery,
    includeProperties: Array<keyof T>,
    options?: TOptions
  ): Promise<T | null> {
    const exclude = includeProperties.map((e) => `${e.toString()}`);

    const data = await this.model
      .findOne(filter as FilterQuery<T>, undefined, (options || {}) as QueryOptions)
      .select(exclude.join(' '));

    if (!data) return null;

    return data.toObject({ virtuals: true });
  }

  async findAllWithSelectFields<TQuery = FilterQuery<T>, TOptions = QueryOptions>(
    includeProperties: Array<keyof T>,
    filter?: TQuery,
    options?: TOptions
  ): Promise<T[]> {
    const exclude = includeProperties.map((e) => `${e.toString()}`);

    if (filter) {
      (filter as FilterQuery<T>) = this.applyFilterWhenFilterParameterIsNotFirstOption(filter as FilterQuery<T>);
    }

    const data = await this.model
      .find(filter as FilterQuery<T>, undefined, (options || {}) as QueryOptions)
      .select(exclude.join(' '));

    return data.map((d) => d.toObject({ virtuals: true }));
  }

  private applyFilterWhenFilterParameterIsNotFirstOption(filter: FilterQuery<T>) {
    if (!filter) {
      filter = { deletedAt: null };
    }

    if (filter?.id) {
      filter._id = filter.id;
      delete filter.id;
    }

    return filter;
  }
}
