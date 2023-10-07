import { Optional, WhereOptions } from 'sequelize';
import sequelize from 'sequelize';
import { MakeNullishOptional } from 'sequelize/types/utils';
import { Model, ModelCtor } from 'sequelize-typescript';

import { CreatedModel, IRepository, RemovedModel, UpdatedModel } from '@/infra/repository';
import { DatabaseOptionsSchema, DatabaseOptionsType, SaveOptionsType } from '@/utils/database/sequelize';
import { ConvertSequelizeFilterToRepository } from '@/utils/decorators/database/postgres/convert-sequelize-filter.decorator';
import { IEntity } from '@/utils/entity';

export class SequelizeRepository<T extends ModelCtor & IEntity> implements IRepository<T> {
  protected Model!: T;

  constructor(Model: T) {
    this.Model = Model;
  }

  @ConvertSequelizeFilterToRepository()
  async findAll<TQuery = Partial<T>, TOpt = DatabaseOptionsType>(filter?: TQuery, options?: TOpt): Promise<T[]> {
    const { schema } = DatabaseOptionsSchema.parse(options);

    const model = await this.Model.schema(schema).findAll({
      where: filter as WhereOptions<T>
    });

    return (model || []).map((m) => m.toJSON());
  }

  @ConvertSequelizeFilterToRepository()
  async find<TQuery = Partial<T>, TOptions = DatabaseOptionsType>(filter: TQuery, options?: TOptions): Promise<T[]> {
    const { schema } = DatabaseOptionsSchema.parse(options);

    const model = await this.Model.schema(schema).findAll({
      where: filter as WhereOptions<T>
    });

    return (model || []).map((m) => m.toJSON());
  }

  async findIn<TOptions = DatabaseOptionsType>(
    filter: { [key in keyof Partial<T>]: string[] },
    options?: TOptions
  ): Promise<T[]> {
    const { schema } = DatabaseOptionsSchema.parse(options);

    const key = Object.keys(filter)[0];

    const model = await this.Model.schema(schema).findAll({
      where: { [key]: { [sequelize.Op.in]: filter[key] } } as WhereOptions<T>
    });

    return (model || []).map((m) => m.toJSON());
  }

  @ConvertSequelizeFilterToRepository()
  async remove<TQuery = WhereOptions<T>, TOpt = DatabaseOptionsType>(
    filter: TQuery,
    options: TOpt
  ): Promise<RemovedModel> {
    const { schema, transaction } = DatabaseOptionsSchema.parse(options);

    const model = await this.Model.schema(schema).destroy({
      where: filter as WhereOptions<T>,
      transaction
    });

    return { deletedCount: model, deleted: !!model };
  }

  @ConvertSequelizeFilterToRepository()
  async findOne<TQuery = Partial<T>, TOptions = DatabaseOptionsType>(filter: TQuery, options?: TOptions): Promise<T> {
    const { schema } = DatabaseOptionsSchema.parse(options);

    const model = await this.Model.schema(schema).findOne({
      where: filter as WhereOptions<T>
    });

    if (!model) return;

    return model.toJSON();
  }

  @ConvertSequelizeFilterToRepository()
  async updateOne<TQuery = Partial<T>, TUpdate = Partial<T>, TOptions = DatabaseOptionsType>(
    filter: TQuery,
    updated: TUpdate,
    options?: TOptions
  ): Promise<UpdatedModel> {
    const { schema, transaction } = DatabaseOptionsSchema.parse(options);

    const model = await this.Model.schema(schema).update(updated, {
      where: filter as WhereOptions<T>,
      transaction
    });

    return {
      modifiedCount: model.length,
      matchedCount: model.length,
      acknowledged: null,
      upsertedCount: model.length,
      upsertedId: null
    };
  }

  @ConvertSequelizeFilterToRepository()
  async updateMany<TQuery = Partial<T>, TUpdate = Partial<T>, TOptions = DatabaseOptionsType>(
    filter: TQuery,
    updated: TUpdate,
    options?: TOptions
  ): Promise<UpdatedModel> {
    const { schema, transaction } = DatabaseOptionsSchema.parse(options);

    const model = await this.Model.schema(schema).update(updated, {
      where: filter as WhereOptions<T>,
      transaction
    });

    return {
      modifiedCount: model.length,
      matchedCount: model.length,
      acknowledged: null,
      upsertedCount: model.length,
      upsertedId: null
    };
  }

  async seed<TOpt = DatabaseOptionsType>(entityList: T[], options: TOpt): Promise<void> {
    const { schema } = DatabaseOptionsSchema.parse(options);

    for (const model of entityList) {
      const data = await this.findById(model.id, { schema });
      if (!data) {
        await this.create(model, { schema: schema });
      }
    }
  }

  async create<TOptions = SaveOptionsType>(document: T, saveOptions: TOptions): Promise<CreatedModel> {
    const { schema, transaction } = DatabaseOptionsSchema.parse(saveOptions);

    const savedDoc = await this.Model.schema(schema).create<Model<T>>(document as unknown as MakeNullishOptional<T>, {
      transaction
    });

    const model = await savedDoc.save();

    return { id: model.id, created: !!model.id };
  }

  async insertMany<TOptions = SaveOptionsType>(documents: T[], saveOptions?: TOptions): Promise<void> {
    const { schema, transaction } = DatabaseOptionsSchema.parse(saveOptions);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await this.Model.schema(schema).bulkCreate<Model<T[]>>(documents as unknown as Optional<T[], any>[], {
      transaction
    });
  }

  @ConvertSequelizeFilterToRepository()
  async findOneWithExcludeFields<TQuery = Partial<T>, TOptions = DatabaseOptionsType>(
    filter: TQuery,
    excludeProperties?: (keyof T)[],
    options?: TOptions
  ): Promise<T> {
    const { schema } = DatabaseOptionsSchema.parse(options);

    const exclude = excludeProperties.map((e) => `${e.toString()}`);

    const model = await this.Model.schema(schema).findOne({
      where: filter as WhereOptions<T>,
      attributes: { exclude }
    });

    if (!model) return;

    return model.toJSON();
  }

  @ConvertSequelizeFilterToRepository()
  async findAllWithExcludeFields<TQuery = Partial<T>, TOptions = DatabaseOptionsType>(
    includeProperties: (keyof T)[],
    filter?: TQuery,
    options?: TOptions
  ): Promise<T[]> {
    const { schema } = DatabaseOptionsSchema.parse(options);

    const exclude = includeProperties.map((e) => `${e.toString()}`);

    Object.assign(filter || {}, { deletedAt: null });

    const model = await this.Model.schema(schema).findAll({
      where: filter as WhereOptions<T>,
      attributes: { exclude }
    });

    return model.map((m) => m.toJSON());
  }

  @ConvertSequelizeFilterToRepository()
  async findOneWithIncludeFields<TQuery = Partial<T>, TOptions = DatabaseOptionsType>(
    filter: TQuery,
    includeProperties: (keyof T)[],
    options?: TOptions
  ): Promise<T> {
    const { schema } = DatabaseOptionsSchema.parse(options);

    const include = includeProperties.map((e) => `${e.toString()}`);

    const model = await this.Model.schema(schema).findOne({
      where: filter as WhereOptions<T>,
      attributes: include
    });

    if (!model) return;

    return model.toJSON();
  }

  @ConvertSequelizeFilterToRepository()
  async findAllWithIncludeFields<TQuery = Partial<T>, TOptions = DatabaseOptionsType>(
    includeProperties: (keyof T)[],
    filter?: TQuery,
    options?: TOptions
  ): Promise<T[]> {
    const { schema } = DatabaseOptionsSchema.parse(options);

    const include = includeProperties.map((e) => `${e.toString()}`);

    Object.assign(filter || {}, { deletedAt: null });

    const model = await this.Model.schema(schema).findAll({
      where: filter as WhereOptions<T>,
      attributes: include
    });

    return model.map((m) => m.toJSON());
  }

  async findById<TOpt = DatabaseOptionsType>(id: string, options: TOpt): Promise<T> {
    const { schema } = DatabaseOptionsSchema.parse(options);

    const model = await this.Model.schema(schema).findOne({ where: { id, deletedAt: null } });

    if (!model) return;

    return model.toJSON();
  }
}
