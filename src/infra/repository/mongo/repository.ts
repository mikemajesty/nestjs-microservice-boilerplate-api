import {
  Document,
  FilterQuery,
  Model,
  QueryOptions,
  SaveOptions,
  UpdateQuery,
  UpdateWithAggregationPipeline
} from 'mongoose';

import { ApiInternalServerException } from '@/utils/exception';
import { convertMongoFilter } from '@/utils/mongo';

import { IRepository } from '../adapter';
import { CreatedModel, RemovedModel, UpdatedModel } from '../types';

export class MongoRepository<T extends Document> implements IRepository<T> {
  constructor(private readonly model: Model<T>) {}

  async isConnected(): Promise<void> {
    if (this.model.db.readyState !== 1) throw new ApiInternalServerException(`db ${this.model.db.name} disconnected`);
  }

  async create(document: T, saveOptions?: SaveOptions): Promise<CreatedModel> {
    const createdEntity = new this.model({ ...document, _id: document.id });
    const savedResult = await createdEntity.save(saveOptions);

    return { id: savedResult.id, created: !!savedResult.id };
  }

  async find(filter: FilterQuery<T>, options?: QueryOptions): Promise<T[]> {
    convertMongoFilter<T>([filter]);
    return (await this.model.find(filter, undefined, options)).map((u) => u.toObject({ virtuals: true }));
  }

  async findById(id: string | number): Promise<T> {
    return (await this.model.findById(id)).toObject({ virtuals: true });
  }

  async findOne(filter: FilterQuery<T>, options?: QueryOptions): Promise<T | null> {
    convertMongoFilter<T>([filter]);

    const data = await this.model.findOne(filter, undefined, options);

    if (!data) return null;

    return data.toObject({ virtuals: true });
  }

  async findAll(filter?: FilterQuery<T>): Promise<T[]> {
    return (await this.model.find(filter)).map((u) => u.toObject({ virtuals: true }));
  }

  async remove(filter: FilterQuery<T>): Promise<RemovedModel> {
    convertMongoFilter<T>([filter]);
    const { deletedCount } = await this.model.deleteOne(filter);
    return { deletedCount, deleted: !!deletedCount };
  }

  async updateOne(
    filter: FilterQuery<T>,
    updated: UpdateWithAggregationPipeline | UpdateQuery<T>,
    options?: QueryOptions
  ): Promise<UpdatedModel> {
    convertMongoFilter<T>([filter]);
    return await this.model.updateOne(filter, updated, options);
  }

  async updateMany(
    filter: FilterQuery<T>,
    updated: UpdateWithAggregationPipeline | UpdateQuery<T>,
    options?: QueryOptions
  ): Promise<UpdatedModel> {
    convertMongoFilter<T>([filter]);
    return await this.model.updateMany(filter, updated, options);
  }
}
