import {
  Document,
  FilterQuery,
  Model,
  QueryOptions,
  SaveOptions,
  UpdateQuery,
  UpdateWithAggregationPipeline
} from 'mongoose';

import { ConvertMongoFilterToBaseRepository } from '@/utils/decorators/database/mongo/convert-mongoose-filter.decorator';
import { ApiInternalServerException } from '@/utils/exception';

import { IRepository } from '../adapter';
import { CreatedModel, RemovedModel, UpdatedModel } from '../types';

export class MongoRepository<T extends Document> implements Omit<IRepository<T>, 'startSession'> {
  constructor(private readonly model: Model<T>) {}

  isConnected(): boolean {
    if (this.model.db.readyState !== 1) throw new ApiInternalServerException(`db ${this.model.db.name} disconnected`);
    return !!this.model.db.readyState;
  }

  async create(document: T, saveOptions?: SaveOptions): Promise<CreatedModel> {
    const createdEntity = new this.model({ ...document, _id: document.id });
    const savedResult = await createdEntity.save(saveOptions);

    return { id: savedResult.id, created: !!savedResult.id };
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
    options?: QueryOptions
  ): Promise<UpdatedModel> {
    return await this.model.updateOne(filter, updated, options);
  }

  @ConvertMongoFilterToBaseRepository()
  async updateMany(
    filter: FilterQuery<T>,
    updated: UpdateWithAggregationPipeline | UpdateQuery<T>,
    options?: QueryOptions
  ): Promise<UpdatedModel> {
    return await this.model.updateMany(filter, updated, options);
  }

  async seed(entityList: T[]): Promise<void> {
    for (const model of entityList) {
      const data = await this.findById(model.id);
      if (!data) {
        await this.create(model);
      }
    }
  }
}
