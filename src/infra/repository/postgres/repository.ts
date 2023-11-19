import { Op, Optional, WhereOptions } from 'sequelize';
import sequelize from 'sequelize';
import { MakeNullishOptional } from 'sequelize/types/utils';
import { Model, ModelCtor } from 'sequelize-typescript';

import {
  CreatedModel,
  CreatedOrUpdateModel,
  DatabaseOperationCommand,
  IRepository,
  RemovedModel,
  UpdatedModel
} from '@/infra/repository';
import { DatabaseOptionsSchema, DatabaseOptionsType, SaveOptionsType } from '@/utils/database/sequelize';
import { ConvertSequelizeFilterToRepository } from '@/utils/decorators/database/postgres/convert-sequelize-filter.decorator';
import { IEntity } from '@/utils/entity';
import { ApiBadRequestException } from '@/utils/exception';

import { validateFindByCommandsFilter } from '../util';

export class SequelizeRepository<T extends ModelCtor & IEntity> implements IRepository<T> {
  protected Model!: T;

  constructor(Model: T) {
    this.Model = Model;
  }

  async findByCommands<TOptions = DatabaseOptionsType>(
    filterList: DatabaseOperationCommand<T>[],
    options?: TOptions
  ): Promise<T[]> {
    const { schema } = DatabaseOptionsSchema.parse(options);

    const postgresSearch = {
      equal: { type: Op.in, like: false },
      not_equal: { type: Op.notIn, like: false },
      not_contains: { type: Op.notILike, like: true },
      contains: { type: Op.iLike, like: true }
    };

    const searchList = {};

    validateFindByCommandsFilter(filterList);

    for (const filter of filterList) {
      const command = postgresSearch[filter.command];

      if (command.like) {
        Object.assign(searchList, {
          [filter.property]: { [command.type]: { [Op.any]: filter.value.map((v) => `%${v}%`) } }
        });
        continue;
      }

      Object.assign(searchList, { [filter.property]: { [command.type]: filter.value } });
    }

    Object.assign(searchList, { deletedAt: null });

    const model = await this.Model.schema(schema).findAll({
      where: searchList as WhereOptions<T>
    });

    return model.map((m) => m.toJSON());
  }

  async createOrUpdate<TUpdate = Partial<T>, TOptions = DatabaseOptionsType>(
    document: TUpdate,
    options?: TOptions
  ): Promise<CreatedOrUpdateModel> {
    const { schema, transaction } = DatabaseOptionsSchema.parse(options);

    if (!document['id']) {
      throw new ApiBadRequestException('id is required');
    }

    const exists = await this.findById(document['id'], options);

    if (!exists) {
      const savedDoc = await this.Model.schema(schema).create<Model<T>>(document as unknown as MakeNullishOptional<T>, {
        transaction
      });

      const model = await savedDoc.save();

      return { id: model.id, created: true, updated: false };
    }

    await this.Model.schema(schema).update(document, {
      where: { id: exists.id } as WhereOptions<T>,
      transaction
    });

    return { id: exists.id, created: false, updated: true };
  }

  @ConvertSequelizeFilterToRepository()
  async findAll<TQuery = Partial<T>, TOpt = DatabaseOptionsType>(filter?: TQuery, options?: TOpt): Promise<T[]> {
    const { schema } = DatabaseOptionsSchema.parse(options);

    const model = await this.Model.schema(schema).findAll({
      where: filter as WhereOptions<T>
    });

    return model.map((m) => m.toJSON());
  }

  @ConvertSequelizeFilterToRepository()
  async find<TQuery = Partial<T>, TOptions = DatabaseOptionsType>(filter: TQuery, options?: TOptions): Promise<T[]> {
    const { schema } = DatabaseOptionsSchema.parse(options);

    const model = await this.Model.schema(schema).findAll({
      where: filter as WhereOptions<T>
    });

    return model.map((m) => m.toJSON());
  }

  async findIn<TOptions = DatabaseOptionsType>(
    filter: { [key in keyof Partial<T>]: string[] },
    options?: TOptions
  ): Promise<T[]> {
    const { schema } = DatabaseOptionsSchema.parse(options);

    const key = Object.keys(filter)[0];

    const model = await this.Model.schema(schema).findAll({
      where: { [key]: { [sequelize.Op.in]: filter[`${key}`] } } as WhereOptions<T>
    });

    return model.map((m) => m.toJSON());
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
  async findOneAndUpdate<TQuery = Partial<T>, TUpdate = Partial<T>, TOptions = DatabaseOptionsType>(
    filter: TQuery,
    updated: TUpdate,
    options?: TOptions
  ): Promise<T> {
    const { schema, transaction } = DatabaseOptionsSchema.parse(options);

    const [rowsEffected] = await this.Model.schema(schema).update(updated, {
      where: filter as WhereOptions<T>,
      transaction
    });

    if (!rowsEffected) {
      return null;
    }

    const model = await this.Model.schema(schema).findOne({
      where: filter as WhereOptions<T>
    });

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

  async findAllWithExcludeFields<TQuery = Partial<T>, TOptions = DatabaseOptionsType>(
    includeProperties: (keyof T)[],
    filter?: TQuery,
    options?: TOptions
  ): Promise<T[]> {
    const { schema } = DatabaseOptionsSchema.parse(options);

    const exclude = includeProperties.map((e) => `${e.toString()}`);

    if (!filter) {
      filter = { deletedAt: null } as TQuery;
    }

    const model = await this.Model.schema(schema).findAll({
      where: filter as WhereOptions<T>,
      attributes: { exclude }
    });

    return model.map((m) => m.toJSON());
  }

  @ConvertSequelizeFilterToRepository()
  async findOneWithSelectFields<TQuery = Partial<T>, TOptions = DatabaseOptionsType>(
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

  async findAllWithSelectFields<TQuery = Partial<T>, TOptions = DatabaseOptionsType>(
    includeProperties: (keyof T)[],
    filter?: TQuery,
    options?: TOptions
  ): Promise<T[]> {
    const { schema } = DatabaseOptionsSchema.parse(options);

    const include = includeProperties.map((e) => `${e.toString()}`);

    if (!filter) {
      filter = { deletedAt: null } as TQuery;
    }

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
