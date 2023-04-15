import { SaveOptions, WhereOptions } from 'sequelize';
import { MakeNullishOptional } from 'sequelize/types/utils';
import { Model, ModelCtor } from 'sequelize-typescript';

import { CreatedModel, IRepository, RemovedModel, UpdatedModel } from '@/infra/repository';
import { IEntity } from '@/utils/entity';

type SequelizeOptions = {
  schema: string;
};

type SaveOptionsType = SaveOptions & SequelizeOptions;

export class SequelizeRepository<T extends ModelCtor & IEntity> implements IRepository<T> {
  protected Model!: T;

  constructor(Model: T) {
    this.Model = Model;
  }

  isConnected(): boolean | Promise<boolean> {
    return this.Model.isInitialized;
  }

  async findAll<TQuery = Partial<T>, TOpt = SequelizeOptions>(filter?: TQuery, options?: TOpt): Promise<T[]> {
    const opt = options as SequelizeOptions;

    const model = await this.Model.schema(opt.schema).findAll({
      where: filter as WhereOptions<T>
    });

    return model as unknown as T[];
  }

  async find<TQuery = Partial<T>, TOptions = SequelizeOptions>(filter: TQuery, options?: TOptions): Promise<T[]> {
    const opt = options as SequelizeOptions;

    const model = await this.Model.schema(opt.schema).findAll({
      where: filter as WhereOptions<T>
    });

    return model as unknown as T[];
  }

  async remove<TQuery = WhereOptions<T>, TOpt = SequelizeOptions>(
    filter: TQuery,
    options: TOpt
  ): Promise<RemovedModel> {
    const opt = options as SequelizeOptions;

    const model = await this.Model.schema(opt.schema).destroy({
      where: filter as WhereOptions<T>
    });

    return { deletedCount: model, deleted: !!model };
  }

  async findOne<TQuery = Partial<T>, TOptions = SequelizeOptions>(filter: TQuery, options?: TOptions): Promise<T> {
    const opt = options as SequelizeOptions;

    const model = await this.Model.schema(opt.schema).findOne({
      where: filter as WhereOptions<T>
    });

    return model as unknown as T;
  }

  async updateOne<TQuery = Partial<T>, TUpdate = Partial<T>, TOptions = SequelizeOptions>(
    filter: TQuery,
    updated: TUpdate,
    options?: TOptions
  ): Promise<UpdatedModel> {
    const opt = options as SequelizeOptions;

    const model = await this.Model.schema(opt.schema).update(updated, {
      where: filter as WhereOptions<T>
    });

    return {
      modifiedCount: model.length,
      matchedCount: model.length,
      acknowledged: null,
      upsertedCount: model.length,
      upsertedId: null
    };
  }

  async updateMany<TQuery = Partial<T>, TUpdate = Partial<T>, TOptions = SequelizeOptions>(
    filter: TQuery,
    updated: TUpdate,
    options?: TOptions
  ): Promise<UpdatedModel> {
    const opt = options as SequelizeOptions;

    const model = await this.Model.schema(opt.schema).update(updated, {
      where: filter as WhereOptions<T>
    });

    return {
      modifiedCount: model.length,
      matchedCount: model.length,
      acknowledged: null,
      upsertedCount: model.length,
      upsertedId: null
    };
  }

  async seed<TOpt = SequelizeOptions>(entityList: T[], options: TOpt): Promise<void> {
    const opt = options as SequelizeOptions;

    for (const model of entityList) {
      const data = await this.findById(model.id, { schema: opt.schema });
      if (!data) {
        await this.create(model, { schema: opt.schema });
      }
    }
  }

  async create<TOptions = SaveOptionsType>(document: T, saveOptions: TOptions): Promise<CreatedModel> {
    const options = saveOptions as SaveOptionsType;

    const savedDoc = await this.Model.schema(options.schema).create<Model<T>>(
      document as unknown as MakeNullishOptional<T>
    );

    const model = await savedDoc.save(options as SaveOptions);

    return { id: model.id, created: !!model.id };
  }

  async findById<TOpt = SequelizeOptions>(id: string, options: TOpt): Promise<T> {
    const opt = options as SequelizeOptions;

    const model = await this.Model.schema(opt.schema).findOne({ where: { id } });

    return model as unknown as T;
  }
}
