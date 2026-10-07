/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/infra/repository.md
 */
import {
  ClientSession,
  Document,
  InsertManyOptions,
  Model,
  MongooseUpdateQueryOptions,
  PaginateModel,
  QueryOptions,
  SaveOptions,
  UpdateQuery,
  UpdateWithAggregationPipeline
} from 'mongoose'

import { DateUtils } from '@/utils/date'
import { NormalizeMongoFilter } from '@/utils/decorators'
import { IEntity } from '@/utils/entity'
import { ApiBadRequestException } from '@/utils/exception'
import { FilterQuery, MongoRepositoryModelSessionType } from '@/utils/mongoose'
import { PaginationInput, PaginationOutput, PaginationUtils } from '@/utils/pagination'

import { IRepository } from '../adapter'
import {
  CreatedModel,
  CreatedOrUpdateModel,
  DatabaseOperationCommand,
  EntityConstructor,
  FilterQueryFilter,
  JoinType,
  MakePartialFilter,
  RemovedModel,
  UpdatedModel
} from '../types'
import { handleDatabaseError, validateFindByCommandsFilter } from '../util'

export class MongoRepository<
  TModel extends Document = Document,
  TEntity extends IEntity = TModel & IEntity
> implements IRepository<TEntity> {
  private readonly context: string = MongoRepository.name

  private paginateModel: MongoRepositoryModelSessionType<PaginateModel<TModel>>

  constructor(
    private readonly model: MongoRepositoryModelSessionType<PaginateModel<TModel>>,
    private readonly Entity: EntityConstructor<TEntity>
  ) {
    this.paginateModel = this.model as MongoRepositoryModelSessionType<PaginateModel<TModel>>
  }

  async runInTransaction<R>(fn: (session: ClientSession) => Promise<R>): Promise<R> {
    const mongoose = this.model.db.base
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
      const result = await fn(session)
      await session.commitTransaction()
      return result
    } catch (err) {
      await session.abortTransaction()
      throw handleDatabaseError({ error: err, context: `${this.context}.runInTransaction` })
    } finally {
      session.endSession()
    }
  }

  async applyPagination<R>(input: PaginationInput<R>, joins?: JoinType<TEntity>): Promise<PaginationOutput<TEntity>> {
    const populatePaths = this.getPopulatePaths(joins)
    const cats = await this.paginateModel.paginate(input.search as FilterQuery<R>, {
      page: input.page,
      limit: input.limit,
      sort: input.sort as object,
      populate: populatePaths,
      options: {}
    })
    return {
      docs: this.hydrateAll(cats.docs),
      limit: input.limit,
      page: input.page,
      total: cats.totalDocs,
      totalPages: PaginationUtils.calculateTotalPages({ limit: input.limit, total: cats.totalDocs })
    }
  }

  async insertMany<TOptions>(documents: TEntity[], saveOptions?: TOptions): Promise<void> {
    try {
      await this.model.insertMany(documents, saveOptions as InsertManyOptions)
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}.insertMany` })
    }
  }

  async create<TOptions>(document: TEntity, saveOptions?: TOptions): Promise<CreatedModel> {
    try {
      const createdEntity = new this.model({
        ...document,
        _id: (document as { _id?: string })._id || document.id
      })
      const savedResult = await createdEntity.save(saveOptions as SaveOptions)
      return { id: savedResult._id.toString(), created: !!savedResult._id }
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}.create` })
    }
  }

  async createOrUpdate<TDoc = UpdateWithAggregationPipeline | UpdateQuery<TEntity>>(
    document: TDoc,
    options?: unknown
  ): Promise<CreatedOrUpdateModel> {
    try {
      const doc = document as { id: string | number }
      if (!doc['id']) {
        throw new ApiBadRequestException('id is required')
      }

      const exists = await this.findById(doc['id'])

      if (!exists) {
        const createdEntity = new this.model({ ...document, _id: doc['id'] })
        const savedResult = await createdEntity.save(options as SaveOptions)
        return { id: savedResult._id.toString(), created: true, updated: false }
      }

      await this.model.updateOne(
        { _id: doc['id'] },
        { $set: document as unknown as TModel },
        options as MongooseUpdateQueryOptions<IEntity>
      )

      return { id: doc['id'].toString(), created: false, updated: true }
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}.createOrUpdate` })
    }
  }

  @NormalizeMongoFilter()
  async find<TFil = FilterQueryFilter<TEntity>, TOptions = FilterQuery<IEntity>>(
    filter: TFil,
    options?: TOptions
  ): Promise<TEntity[]> {
    try {
      const defaultOptions = options
      const results = await this.model.find(
        filter as FilterQuery<TModel>,
        undefined,
        defaultOptions as FilterQuery<IEntity>
      )
      return this.hydrateAll(results)
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}.find` })
    }
  }

  async findById(id: string | number): Promise<TEntity | null> {
    try {
      const model = await this.model.findById(id)
      return model ? this.hydrate(model) : null
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}.findById` })
    }
  }

  @NormalizeMongoFilter()
  async findOne<TFil = FilterQueryFilter<TEntity>, TQue = FilterQuery<IEntity>>(
    filter: TFil,
    options?: TQue
  ): Promise<TEntity | null> {
    try {
      const defaultOptions = options
      const data = await this.model.findOne(
        filter as FilterQuery<TModel>,
        undefined,
        defaultOptions as FilterQuery<IEntity>
      )
      return data ? this.hydrate(data) : null
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}.findOne` })
    }
  }

  @NormalizeMongoFilter()
  async findAll<TFil = FilterQueryFilter<TEntity>, TOpt = FilterQuery<IEntity>>(
    filter?: TFil,
    options?: TOpt
  ): Promise<TEntity[]> {
    try {
      const defaultOptions = options
      const modelList = await this.model.find(
        filter as FilterQuery<TModel>,
        undefined,
        defaultOptions as FilterQuery<IEntity>
      )
      return this.hydrateAll(modelList)
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}.findAll` })
    }
  }

  @NormalizeMongoFilter()
  async remove<TQuery = FilterQueryFilter<TEntity>, TOpt = unknown>(
    filter: TQuery,
    options?: TOpt
  ): Promise<RemovedModel> {
    try {
      const { deletedCount } = await this.model.deleteOne(
        filter as FilterQuery<TModel>,
        options as Parameters<Model<TModel>['deleteOne']>[1]
      )
      return { deletedCount: deletedCount || 0, deleted: !!deletedCount }
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}.remove` })
    }
  }

  @NormalizeMongoFilter()
  async updateOne<
    TQuery = FilterQueryFilter<TEntity>,
    TUpdate = UpdateWithAggregationPipeline | UpdateQuery<TEntity>,
    TOptions = MongooseUpdateQueryOptions
  >(filter: TQuery, updated: TUpdate, options?: TOptions): Promise<UpdatedModel> {
    try {
      return await this.model.updateOne(
        filter as FilterQuery<TModel>,
        { $set: Object.assign({}, updated) },
        options as MongooseUpdateQueryOptions
      )
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}.updateOne` })
    }
  }

  @NormalizeMongoFilter()
  async findOneAndUpdate<
    TQuery = FilterQueryFilter<TEntity>,
    TUpdate = UpdateWithAggregationPipeline | UpdateQuery<TEntity>
  >(filter: TQuery, updated: TUpdate, options: unknown = {}): Promise<TEntity | null> {
    try {
      const updateOptions = {
        ...(options as FilterQuery<IEntity>),
        returnDocument: 'after' as const
      } as QueryOptions

      const model = await this.model.findOneAndUpdate(
        filter as FilterQuery<TModel>,
        { $set: updated as UpdateWithAggregationPipeline | UpdateQuery<TModel> },
        updateOptions
      )

      return model ? this.hydrate(model) : null
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}.findOneAndUpdate` })
    }
  }

  @NormalizeMongoFilter()
  async updateMany<
    TQuery = FilterQueryFilter<TEntity>,
    TUpdate = UpdateWithAggregationPipeline | UpdateQuery<TEntity>,
    TOptions = MongooseUpdateQueryOptions
  >(filter: TQuery, updated: TUpdate, options?: TOptions): Promise<UpdatedModel> {
    try {
      return await this.model.updateMany(
        filter as FilterQuery<TModel>,
        { $set: updated as UpdateWithAggregationPipeline | UpdateQuery<TModel> },
        options as MongooseUpdateQueryOptions
      )
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}.updateMany` })
    }
  }

  async findIn<TOptions = FilterQuery<IEntity>>(
    input: { [key in keyof TEntity]: string[] },
    options?: TOptions
  ): Promise<TEntity[]> {
    try {
      const where: FilterQuery<IEntity> = {
        deletedAt: null
      }

      for (const key of Object.keys(input)) {
        where[key === 'id' ? '_id' : key] = { $in: (input as { [key: string]: unknown })[`${key}`] }
      }

      const defaultOptions = options
      const data = await this.model.find(where, undefined, defaultOptions as FilterQuery<IEntity>)
      return this.hydrateAll(data)
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}.findIn` })
    }
  }

  async findOr<TOptions = FilterQuery<IEntity>>(
    propertyList: (keyof TEntity)[],
    value: string,
    options?: TOptions
  ): Promise<TEntity[]> {
    try {
      const filter = propertyList.map((key) => {
        return { [key === 'id' ? '_id' : key]: value }
      })

      const defaultOptions = options
      const data = await this.model.find(
        { $or: filter as FilterQuery<TModel>[], deletedAt: null } as FilterQuery<IEntity>,
        undefined,
        defaultOptions as FilterQuery<IEntity>
      )
      return this.hydrateAll(data)
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}.findOr` })
    }
  }

  async findOneByCommands<TOptions = FilterQuery<IEntity>>(
    filterList: DatabaseOperationCommand<TEntity>[],
    options?: TOptions
  ): Promise<TEntity | null> {
    try {
      const searchList = this.buildCommandFilter(filterList)
      const defaultOptions = options
      const data = await this.model.findOne(searchList, undefined, defaultOptions as FilterQuery<IEntity>)
      return data ? this.hydrate(data) : null
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}.findOneByCommands` })
    }
  }

  async findByCommands<TOptions = FilterQuery<IEntity>>(
    filterList: DatabaseOperationCommand<TEntity>[],
    options?: TOptions
  ): Promise<TEntity[]> {
    try {
      const searchList = this.buildCommandFilter(filterList)
      const defaultOptions = options
      const data = await this.model.find(searchList, undefined, defaultOptions as FilterQuery<IEntity>)
      return this.hydrateAll(data)
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}.findByCommands` })
    }
  }

  @NormalizeMongoFilter()
  async findOneWithExcludeFields<TQuery = FilterQueryFilter<TEntity>, TOptions = FilterQuery<IEntity>>(
    filter: TQuery,
    excludeProperties: Array<keyof TEntity>,
    options?: TOptions
  ): Promise<TEntity | null> {
    try {
      const exclude = excludeProperties.map((e) => `-${e.toString()}`)
      const defaultOptions = options

      const data = await this.model
        .findOne(filter as FilterQuery<TModel>, undefined, defaultOptions as FilterQuery<IEntity>)
        .select(exclude.join(' '))

      return data ? this.hydrate(data) : null
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}.findOneWithExcludeFields` })
    }
  }

  async findAllWithExcludeFields<TQuery = FilterQueryFilter<TEntity>, TOptions = FilterQuery<IEntity>>(
    excludeProperties: Array<keyof TEntity>,
    filter?: TQuery,
    options?: TOptions
  ): Promise<TEntity[]> {
    try {
      const exclude = excludeProperties.map((e) => `-${e.toString()}`)
      const processedFilter = this.applyFilterWhenFilterParameterIsNotFirstOption(filter as FilterQuery<TModel>)
      const defaultOptions = options

      const data = await this.model
        .find(processedFilter, undefined, defaultOptions as FilterQuery<IEntity>)
        .select(exclude.join(' '))

      return this.hydrateAll(data)
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}.findAllWithExcludeFields` })
    }
  }

  @NormalizeMongoFilter()
  async findOneWithSelectFields<TQuery = FilterQueryFilter<TEntity>, TOptions = FilterQuery<IEntity>>(
    filter: TQuery,
    includeProperties: Array<keyof TEntity>,
    options?: TOptions
  ): Promise<TEntity | null> {
    try {
      const include = includeProperties.map((e) => `${e.toString()}`)
      const defaultOptions = options

      const data = await this.model
        .findOne(filter as FilterQuery<TModel>, undefined, defaultOptions as FilterQuery<IEntity>)
        .select(include.join(' '))

      return data ? this.hydrate(data) : null
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}.findOneWithSelectFields` })
    }
  }

  @NormalizeMongoFilter()
  async findAllWithSelectFields<TQuery = FilterQueryFilter<TEntity>, TOptions = FilterQuery<IEntity>>(
    includeProperties: Array<keyof TEntity>,
    filter?: TQuery,
    options?: TOptions
  ): Promise<TEntity[]> {
    try {
      const include = includeProperties.map((e) => `${e.toString()}`)
      const processedFilter = this.applyFilterWhenFilterParameterIsNotFirstOption(filter as FilterQuery<TModel>)
      const defaultOptions = options

      const data = await this.model
        .find(processedFilter, undefined, defaultOptions as FilterQuery<IEntity>)
        .select(include.join(' '))

      return this.hydrateAll(data)
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}.findAllWithSelectFields` })
    }
  }

  @NormalizeMongoFilter()
  async findOneWithRelation<Filter = MakePartialFilter<TEntity>>(
    filter: Filter,
    joins?: JoinType<TEntity>
  ): Promise<TEntity | null> {
    const populatePaths = this.getPopulatePaths(joins)

    const query = this.model.findOne(filter as FilterQuery<TModel>)

    const finalQuery = populatePaths.reduce((queryAccumulator, path) => queryAccumulator.populate(path), query)

    const data = await finalQuery.exec()
    if (!data) {
      return null
    }
    return this.hydrate(data)
  }

  @NormalizeMongoFilter()
  async findAllWithRelation<Filter = MakePartialFilter<TEntity>>(
    filter?: Filter,
    joins?: JoinType<TEntity>
  ): Promise<TEntity[]> {
    const populatePaths = this.getPopulatePaths(joins)

    const query = this.model.find(filter ?? {})

    const finalQuery = populatePaths.reduce((queryAccumulator, path) => queryAccumulator.populate(path), query)

    const data = await finalQuery.exec()

    if (!data.length) {
      return []
    }

    return this.hydrateAll(data)
  }

  @NormalizeMongoFilter()
  async exists<TQuery = MakePartialFilter<TEntity>>(filter: TQuery): Promise<boolean> {
    const query = this.model.exists(filter as FilterQuery<TModel>)

    const result = await query
    return !!result
  }

  @NormalizeMongoFilter()
  async existsOnUpdate<TQuery = MakePartialFilter<TEntity>>(filter: TQuery, id: string | number): Promise<boolean> {
    const query = { ...filter, _id: { $ne: id } }
    const operation = this.model.exists(query as FilterQuery<TModel>)

    const result = await operation
    return !!result
  }

  @NormalizeMongoFilter()
  async softRemove(entity: MakePartialFilter<TEntity>): Promise<TEntity> {
    return (await this.findOneAndUpdate(
      entity as FilterQuery<TEntity>,
      { deletedAt: DateUtils.now() } as UpdateQuery<TEntity>
    )) as TEntity
  }

  private getPopulatePaths(joins?: JoinType<TEntity>): string[] {
    if (!joins) return []

    return Object.keys(joins).filter((key) => joins[key as keyof JoinType<TEntity>] === true)
  }

  private buildCommandFilter(filterList: DatabaseOperationCommand<TEntity>[]): FilterQuery<TModel> {
    const mongoSearch = {
      equal: { type: '$in', like: false },
      not_equal: { type: '$nin', like: false },
      not_contains: { type: '$nin', like: true },
      contains: { type: '$in', like: true }
    }

    const searchList: Record<string, unknown> = {}

    validateFindByCommandsFilter(filterList)

    for (const filter of filterList) {
      const command = mongoSearch[filter.command]

      if (command.like) {
        Object.assign(searchList, {
          [filter.property === 'id' ? '_id' : (filter.property as string)]: {
            [command.type]: filter.value.map((value) => new RegExp(`^${value}`, 'i'))
          }
        })
        continue
      }

      Object.assign(searchList, {
        [filter.property === 'id' ? '_id' : (filter.property as string)]: { [command.type]: filter.value }
      })
    }

    Object.assign(searchList, { deletedAt: null })
    return searchList as FilterQuery<TModel>
  }

  private applyFilterWhenFilterParameterIsNotFirstOption(filter?: FilterQuery<TModel>): FilterQuery<TModel> {
    if (!filter) {
      return { deletedAt: null } as unknown as FilterQuery<TModel>
    }

    const processedFilter = { ...filter } as Record<string, unknown>

    if (processedFilter.id) {
      processedFilter._id = processedFilter.id
      delete processedFilter.id
    }

    if (!processedFilter.deletedAt) {
      processedFilter.deletedAt = null
    }

    return processedFilter as FilterQuery<TModel>
  }

  protected hydrate(document: TModel): TEntity {
    const object = document.toObject({ virtuals: true }) as TEntity
    if (!this.Entity || object instanceof this.Entity) {
      return object
    }
    return new this.Entity(object)
  }

  private hydrateAll(documents: TModel[]): TEntity[] {
    return documents.map((document) => this.hydrate(document))
  }
}
