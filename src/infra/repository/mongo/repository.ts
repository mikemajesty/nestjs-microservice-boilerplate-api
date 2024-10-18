import {
  Document,
  FilterQuery,
  Model,
  QueryOptions,
  SaveOptions,
  UpdateQuery,
  UpdateWithAggregationPipeline
} from 'mongoose';

import { ConvertMongoFilterToBaseRepository } from '@/utils/decorators';
import { ApiBadRequestException } from '@/utils/exception';

import { IRepository } from '../adapter';
import { CreatedModel, CreatedOrUpdateModel, DatabaseOperationCommand, RemovedModel, UpdatedModel } from '../types';
import { validateFindByCommandsFilter } from '../util';

export class MongoRepository<T extends Document> implements IRepository<T> {
  constructor(private readonly model: Model<T>) {}

  async insertMany<TOptions = unknown>(documents: T[], saveOptions?: TOptions): Promise<void> {
    await this.model.insertMany(documents, saveOptions);
  }

  async create(document: T, saveOptions?: SaveOptions): Promise<CreatedModel> {
    const createdEntity = new this.model({ ...document, _id: document.id });
    const savedResult = await createdEntity.save(saveOptions);

    return { id: savedResult.id, created: !!savedResult.id };
  }

  async createOrUpdate(
    document: UpdateWithAggregationPipeline | UpdateQuery<T>,
    options?: unknown
  ): Promise<CreatedOrUpdateModel> {
    if (!document['id']) {
      throw new ApiBadRequestException('id is required');
    }

    const exists = await this.findById(document['id']);

    if (!exists) {
      const createdEntity = new this.model({ ...document, _id: document['id'] });
      const savedResult = await createdEntity.save(options);

      return { id: savedResult.id, created: true, updated: false };
    }

    await this.model.updateOne({ _id: exists.id }, { $set: document }, options);

    return { id: exists.id, created: false, updated: true };
  }

  @ConvertMongoFilterToBaseRepository()
  async find(filter: FilterQuery<T>, options?: QueryOptions): Promise<T[]> {
    return (await this.model.find(filter, undefined, options)).map((u) => u.toObject({ virtuals: true }));
  }

  async findById(id: string | number): Promise<T> {
    const model = await this.model.findById(id);

    if (!model) return null;

    return model.toObject({ virtuals: true });
  }

  @ConvertMongoFilterToBaseRepository()
  async findOne(filter: FilterQuery<T>, options?: QueryOptions): Promise<T | null> {
    const data = await this.model.findOne(filter, undefined, options);

    if (!data) return null;

    return data.toObject({ virtuals: true });
  }

  @ConvertMongoFilterToBaseRepository()
  async findAll(filter?: FilterQuery<T>): Promise<T[]> {
    const modelList = await this.model.find(filter);

    return (modelList || []).map((u) => u.toObject({ virtuals: true }));
  }

  @ConvertMongoFilterToBaseRepository()
  async remove(filter: FilterQuery<T>): Promise<RemovedModel> {
    const { deletedCount } = await this.model.deleteOne(filter);
    return { deletedCount, deleted: !!deletedCount };
  }

  @ConvertMongoFilterToBaseRepository()
  async updateOne(
    filter: FilterQuery<T>,
    updated: UpdateWithAggregationPipeline | UpdateQuery<T>,
    options?: unknown
  ): Promise<UpdatedModel> {
    return await this.model.updateOne(filter, { $set: Object.assign({}, updated) }, options);
  }

  @ConvertMongoFilterToBaseRepository()
  async findOneAndUpdate(
    filter: FilterQuery<T>,
    updated: UpdateWithAggregationPipeline | UpdateQuery<T>,
    options: QueryOptions = {}
  ): Promise<T> {
    Object.assign(options, { new: true });

    const model = await this.model.findOneAndUpdate(filter, { $set: updated }, options);

    if (!model) {
      return null;
    }

    return model.toObject({ virtuals: true });
  }

  @ConvertMongoFilterToBaseRepository()
  async updateMany(
    filter: FilterQuery<T>,
    updated: UpdateWithAggregationPipeline | UpdateQuery<T>,
    options?: unknown
  ): Promise<UpdatedModel> {
    return await this.model.updateMany(filter, { $set: updated }, options);
  }

  async findIn(input: { [key in keyof T]: string[] }, options?: QueryOptions): Promise<T[]> {
    const where = {
      deletedAt: null
    };
    for (const key of Object.keys(input)) {
      where[key === 'id' ? '_id' : key] = { $in: input[`${key}`] };
    }
    const filter = where;
    const data = await this.model.find(filter, null, options);

    return data.map((d) => d.toObject({ virtuals: true }));
  }

  async findOr(propertyList: (keyof T)[], value: string, options?: QueryOptions): Promise<T[]> {
    const filter = propertyList.map((key) => {
      return { [key === 'id' ? '_id' : key]: value };
    });
    const data = await this.model.find({ $or: filter as FilterQuery<T>[], deletedAt: null }, null, options);

    return data.map((d) => d.toObject({ virtuals: true }));
  }

  async findOneByCommands(filterList: DatabaseOperationCommand<T>[], options?: QueryOptions): Promise<T> {
    const data = await this.findByCommands(filterList, options);

    if (data.length) {
      return data.find(Boolean);
    }

    return null;
  }

  async findByCommands(filterList: DatabaseOperationCommand<T>[], options?: QueryOptions): Promise<T[]> {
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

    const data = await this.model.find(searchList, null, options);

    return data.map((d) => d.toObject({ virtuals: true }));
  }

  @ConvertMongoFilterToBaseRepository()
  async findOneWithExcludeFields(
    filter: FilterQuery<T>,
    excludeProperties: Array<keyof T>,
    options?: QueryOptions
  ): Promise<T> {
    const exclude = excludeProperties.map((e) => `-${e.toString()}`);

    const data = await this.model.findOne(filter, undefined, options).select(exclude.join(' '));

    if (!data) return null;

    return data.toObject({ virtuals: true });
  }

  async findAllWithExcludeFields(
    excludeProperties: Array<keyof T>,
    filter?: FilterQuery<T>,
    options?: QueryOptions
  ): Promise<T[]> {
    const exclude = excludeProperties.map((e) => `-${e.toString()}`);

    filter = this.applyFilterWhenFilterParameterIsNotFirstOption(filter);

    const data = await this.model.find(filter, undefined, options).select(exclude.join(' '));

    return data.map((d) => d.toObject({ virtuals: true }));
  }

  @ConvertMongoFilterToBaseRepository()
  async findOneWithSelectFields(
    filter: FilterQuery<T>,
    includeProperties: Array<keyof T>,
    options?: QueryOptions
  ): Promise<T> {
    const exclude = includeProperties.map((e) => `${e.toString()}`);

    const data = await this.model.findOne(filter, undefined, options).select(exclude.join(' '));

    if (!data) return null;

    return data.toObject({ virtuals: true });
  }

  async findAllWithSelectFields(
    includeProperties: Array<keyof T>,
    filter?: FilterQuery<T>,
    options?: QueryOptions
  ): Promise<T[]> {
    const exclude = includeProperties.map((e) => `${e.toString()}`);

    filter = this.applyFilterWhenFilterParameterIsNotFirstOption(filter);

    const data = await this.model.find(filter, undefined, options).select(exclude.join(' '));

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
