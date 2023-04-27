import { WhereOptions } from 'sequelize';
import { MakeNullishOptional } from 'sequelize/types/utils';
import { Model, ModelCtor } from 'sequelize-typescript';

import { CreatedModel, IRepository, RemovedModel, UpdatedModel } from '@/infra/repository';
import { DatabaseOptionsSchema, DatabaseOptionsType, SaveOptionsType } from '@/utils/database/sequelize';
import { ConvertSequelizeFilterToRepository } from '@/utils/decorators/database/postgres/convert-sequelize-filter.decorator';
import { IEntity } from '@/utils/entity';

export class SequelizeRepository<T extends ModelCtor & IEntity> implements Omit<IRepository<T>, 'startSession'> {
  protected Model!: T;

  constructor(Model: T) {
    this.Model = Model;
  }

  isConnected(): boolean | Promise<boolean> {
    return this.Model.isInitialized;
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

  async findById<TOpt = DatabaseOptionsType>(id: string, options: TOpt): Promise<T> {
    const { schema } = DatabaseOptionsSchema.parse(options);

    const model = await this.Model.schema(schema).findOne({ where: { id, deletedAt: null } });

    if (!model) return;

    return model.toJSON();
  }
}
