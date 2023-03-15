import { BaseEntity, FindOneOptions, FindOptionsWhere, Repository, SaveOptions } from 'typeorm';

import { IEntity } from '@/utils/entity';
import { ApiInternalServerException } from '@/utils/exception';

import { IRepository } from '../adapter';
import { CreatedModel, RemovedModel, UpdatedModel } from '../types';

export class PostgresRepository<T extends BaseEntity & IEntity> implements Partial<IRepository<T>> {
  constructor(readonly repository: Repository<T & IEntity>) {}

  isConnected(): Promise<void> {
    const connected = this.repository.manager.connection.isInitialized;
    throw new ApiInternalServerException(`db ${connected} disconnected`);
  }

  async create<TOptions = SaveOptions>(document: T, saveOptions?: TOptions): Promise<CreatedModel> {
    const entity = this.repository.create(document);
    const model = await entity.save(saveOptions);
    return { created: model.hasId(), id: model.id };
  }

  async findById(id: string): Promise<T> {
    return await this.repository.findOne({
      where: { id, deletedAt: null }
    } as FindOneOptions<T>);
  }

  async findAll(): Promise<T[]> {
    return await this.repository.find({
      where: { deletedAt: null }
    } as FindOneOptions<T>);
  }

  async find<TQuery = FindOptionsWhere<T> | FindOptionsWhere<T>[]>(filter: TQuery): Promise<T[]> {
    return await this.repository.findBy({ ...filter, deletedAt: null } as FindOptionsWhere<T> | FindOptionsWhere<T>[]);
  }

  async remove<TQuery = FindOptionsWhere<T> | number | number[]>(filter: TQuery): Promise<RemovedModel> {
    const data = await this.repository.delete(filter as FindOptionsWhere<T>);
    return { deletedCount: data.affected, deleted: !!data.affected };
  }

  async findOne<TQuery = FindOneOptions<T>>(filter: TQuery): Promise<T> {
    Object.assign(filter, { deletedAt: null });
    return await this.repository.findOne({
      where: filter
    } as FindOneOptions<T>);
  }

  async updateOne<TQuery = FindOptionsWhere<T>, TOptions = object>(
    filter: TQuery,
    options: TOptions
  ): Promise<UpdatedModel> {
    const updated = await this.repository.update(filter as FindOptionsWhere<T>, options as object);
    return {
      modifiedCount: updated.affected,
      upsertedCount: 0,
      upsertedId: 0,
      matchedCount: updated.affected,
      acknowledged: !!updated.affected
    };
  }
}
