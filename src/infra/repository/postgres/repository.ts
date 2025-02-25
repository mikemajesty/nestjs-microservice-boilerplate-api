import { BaseEntity, FindOneOptions, FindOptionsWhere, In, Raw, Repository, SaveOptions } from 'typeorm';

import { IEntity } from '@/utils/entity';

import { IRepository } from '../adapter';
import { CreatedModel, CreatedOrUpdateModel, DatabaseOperationCommand, RemovedModel, UpdatedModel } from '../types';

export class TypeORMRepository<T extends BaseEntity & IEntity = BaseEntity & IEntity> implements IRepository<T> {
  constructor(readonly repository: Repository<T>) {}

  async findOr(propertyList: (keyof T)[], value: string): Promise<T[]> {
    const filter = propertyList.map((property) => {
      return { [property]: value };
    });

    Object.assign(filter, { deletedAt: null });
    return this.repository.find({ where: filter as FindOptionsWhere<T>[] | FindOptionsWhere<T> });
  }

  async create<TOptions = SaveOptions>(document: T, saveOptions?: TOptions): Promise<CreatedModel> {
    const entity = this.repository.create(document);
    const model = await entity.save(saveOptions as SaveOptions);
    return { created: model.hasId(), id: model.id };
  }

  async findById(id: string): Promise<T | null> {
    return this.repository.findOne({ where: { id } } as FindOneOptions<T>);
  }

  async insertMany(document: T[]): Promise<void> {
    await this.repository.insert(document as object[]);
  }

  async createOrUpdate<TUpdate = Partial<T>>(updated: TUpdate): Promise<CreatedOrUpdateModel> {
    const documentEntity: IEntity = updated as IEntity;
    if (!documentEntity?.id) {
      throw new Error('id is required');
    }

    const exists = await this.findById(documentEntity.id);

    if (!exists) {
      const created = await this.create(updated as unknown as T);

      return { id: created.id, created: true, updated: false };
    }

    const row = await this.repository.update(
      { id: exists['id'] } as FindOptionsWhere<T>,
      { ...exists, ...updated } as object
    );

    return { id: exists['id'], created: false, updated: (row.affected || 0) > 0 };
  }

  async findAll(): Promise<T[]> {
    return this.repository.find();
  }

  async find<TQuery = Partial<T>>(filter: TQuery): Promise<T[]> {
    return this.repository.find({
      where: { ...filter, deleted_at: null }
    } as FindOneOptions<T>);
  }

  async findIn(filter: { [key in keyof Partial<T>]: string[] }): Promise<T[]> {
    const where: { [key: string]: unknown } = {
      deletedAt: null
    };
    for (const key of Object.keys(filter)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where[`${key}`] = In((filter as { [key: string]: any })[`${key}`]);
    }
    return this.repository.find({
      where
    } as FindOneOptions<T>);
  }

  async findOneByCommands(filterList: DatabaseOperationCommand<T>[]): Promise<T | null> {
    const searchList: { [key: string]: unknown } = {};

    const postgresSearch = {
      equal: {
        query: (value: unknown[]) =>
          Raw((alias) => `${alias} ILIKE ANY ('{${value.map((v) => `${`${v}`}`).join(', ')}}')`),
        like: false
      },
      not_equal: {
        query: (value: unknown[]) =>
          Raw((alias) => `${alias} NOT ILIKE ALL (ARRAY[${value.map((v) => `'${v}'`).join(', ')}])`),
        like: false
      },
      not_contains: {
        query: (value: unknown[]) =>
          Raw((alias) => `${alias} NOT ILIKE ALL (ARRAY[${value.map((v) => `'%${v}%'`).join(', ')}])`),
        like: true
      },
      contains: {
        query: (value: unknown[]) =>
          Raw((alias) => `${alias} ILIKE ANY ('{${value.map((v) => `${`%${v}%`}`).join(', ')}}')`),
        like: true
      }
    };

    for (const filter of filterList) {
      searchList[`${filter.property.toString()}`] = postgresSearch[filter.command].query(filter.value);
    }

    const result = await this.repository.findOne({
      where: searchList
    } as FindOneOptions<T>);

    if (!result) {
      return null;
    }

    return result;
  }

  async findByCommands(filterList: DatabaseOperationCommand<T>[]): Promise<T[]> {
    const searchList: { [key: string]: unknown } = {};

    const postgresSearch = {
      equal: {
        query: (value: unknown[]) =>
          Raw((alias) => `${alias} ILIKE ANY ('{${value.map((v) => `${`${v}`}`).join(', ')}}')`),
        like: false
      },
      not_equal: {
        query: (value: unknown[]) =>
          Raw((alias) => `${alias} NOT ILIKE ALL (ARRAY[${value.map((v) => `'${v}'`).join(', ')}])`),
        like: false
      },
      not_contains: {
        query: (value: unknown[]) =>
          Raw((alias) => `${alias} NOT ILIKE ALL (ARRAY[${value.map((v) => `'%${v}%'`).join(', ')}])`),
        like: true
      },
      contains: {
        query: (value: unknown[]) =>
          Raw((alias) => `${alias} ILIKE ANY ('{${value.map((v) => `${`%${v}%`}`).join(', ')}}')`),
        like: true
      }
    };

    for (const filter of filterList) {
      searchList[`${filter.property.toString()}`] = postgresSearch[filter.command].query(filter.value);
    }

    return this.repository.find({
      where: searchList
    } as FindOneOptions<T>);
  }

  async remove<TQuery = Partial<T>>(filter: TQuery): Promise<RemovedModel> {
    const data = await this.repository.delete(filter as FindOptionsWhere<T>);
    return { deletedCount: data.affected || 0, deleted: !!data.affected };
  }

  async findOne<TQuery = Partial<T>>(filter: TQuery): Promise<T | null> {
    return this.repository.findOne({
      where: filter
    } as FindOneOptions<T>);
  }

  async updateOne<TQuery = Partial<T>, TUpdate = Partial<T>>(filter: TQuery, updated: TUpdate): Promise<UpdatedModel> {
    const data = await this.repository.update(filter as FindOptionsWhere<T>, Object.assign({}, updated));
    return {
      modifiedCount: data.affected || 0,
      upsertedCount: 0,
      upsertedId: 0,
      matchedCount: data.affected || 0,
      acknowledged: !!data.affected
    };
  }

  async findOneAndUpdate<TQuery = Partial<T>, TUpdate = Partial<T>>(
    filter: TQuery,
    updated: TUpdate
  ): Promise<T | null> {
    await this.repository.update(filter as FindOptionsWhere<T>, updated as object);

    return this.findOne(filter);
  }

  async updateMany<TQuery = Partial<T>, TUpdate = Partial<T>>(filter: TQuery, updated: TUpdate): Promise<UpdatedModel> {
    const data = await this.repository.update(filter as FindOptionsWhere<T>, updated as object);
    return {
      modifiedCount: data.affected || 0,
      upsertedCount: 0,
      upsertedId: 0,
      matchedCount: data.affected || 0,
      acknowledged: !!data.affected
    };
  }

  async findOneWithSelectFields<TQuery = Partial<T>>(
    filter: TQuery,
    includeProperties: (keyof T)[]
  ): Promise<T | null> {
    const select = includeProperties.map((e) => `${e.toString()}`) as (keyof T)[];
    return this.repository.findOne({
      where: filter as FindOptionsWhere<T>,
      select
    });
  }

  async findAllWithSelectFields<TQuery = Partial<T>>(includeProperties: (keyof T)[], filter?: TQuery): Promise<T[]> {
    const select = includeProperties.map((e) => `${e.toString()}`) as (keyof T)[];
    return this.repository.find({
      where: filter as FindOptionsWhere<T>,
      select
    });
  }

  async findOneWithExcludeFields(filter: unknown, excludeProperties: (keyof T)[]): Promise<T | null> {
    const select = excludeProperties.map((e) => `${e.toString()}`);
    return this.repository.findOne({
      where: filter as FindOptionsWhere<T>,
      select: this.excludeColumns(select) as (keyof T)[]
    });
  }

  async findAllWithExcludeFields<TQuery = Partial<T>>(excludeProperties: (keyof T)[], filter?: TQuery): Promise<T[]> {
    const select = excludeProperties.map((e) => `${e.toString()}`);
    return this.repository.find({
      where: filter as FindOptionsWhere<T>,
      select: this.excludeColumns(select) as (keyof T)[]
    });
  }

  private excludeColumns = (columnsToExclude: string[]): string[] =>
    this.repository.metadata.columns
      .map((column) => column.databaseName)
      .filter((columnName) => !columnsToExclude.includes(columnName));
}
