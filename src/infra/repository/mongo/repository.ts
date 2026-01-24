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
  SaveOptions,
  UpdateQuery,
  UpdateWithAggregationPipeline
} from 'mongoose'

import { DateUtils } from '@/utils/date'
import { ConvertMongoFilterToBaseRepository } from '@/utils/decorators'
import { IEntity } from '@/utils/entity'
import { ApiBadRequestException } from '@/utils/exception'
import { FilterQuery, MongoRepositoryModelSessionType } from '@/utils/mongoose'
import { PaginationInput, PaginationOutput } from '@/utils/pagination'

import { IRepository } from '../adapter'
import {
  CreatedModel,
  CreatedOrUpdateModel,
  DatabaseOperationCommand,
  JoinType,
  RemovedModel,
  UpdatedModel
} from '../types'
import { handleDatabaseError, validateFindByCommandsFilter } from '../util'

export class MongoRepository<T extends Document = Document> implements IRepository<T> {
  private readonly context: string = MongoRepository.name

  private paginateModel: MongoRepositoryModelSessionType<PaginateModel<T>>

  constructor(private readonly model: Model<T>) {
    this.paginateModel = this.model as MongoRepositoryModelSessionType<PaginateModel<T>>
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
      throw handleDatabaseError({ error: err, context: `${this.context}/runInTransaction` })
    } finally {
      session.endSession()
    }
  }

  async applyPagination<R>(input: PaginationInput<R>): Promise<PaginationOutput<T>> {
    const cats = await this.paginateModel.paginate(input.search as FilterQuery<R>, {
      page: input.page,
      limit: input.limit,
      sort: input.sort as object
    })
    return {
      docs: cats.docs.map((u) => this.toObject(u)),
      limit: input.limit,
      page: input.page,
      total: cats.totalDocs
    }
  }

  async insertMany<TOptions>(documents: T[], saveOptions?: TOptions): Promise<void> {
    try {
      await this.model.insertMany(documents, saveOptions as InsertManyOptions)
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}/insertMany` })
    }
  }

  async create<TOptions>(document: T, saveOptions?: TOptions): Promise<CreatedModel> {
    try {
      const createdEntity = new this.model({
        ...document,
        _id: document._id || (document as { id?: string })?.['id']
      })
      const savedResult = await createdEntity.save(saveOptions as SaveOptions)
      return { id: savedResult._id.toString(), created: !!savedResult._id }
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}/create` })
    }
  }

  async createOrUpdate<TDoc = UpdateWithAggregationPipeline | UpdateQuery<T>>(
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
        { $set: document as unknown as T },
        options as MongooseUpdateQueryOptions<IEntity>
      )

      return { id: doc['id'].toString(), created: false, updated: true }
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}/createOrUpdate` })
    }
  }

  @ConvertMongoFilterToBaseRepository()
  async find<TFil = FilterQuery<T>, TOptions = FilterQuery<IEntity>>(filter: TFil, options?: TOptions): Promise<T[]> {
    try {
      const defaultOptions = { ...options }
      const results = await this.model.find(filter as FilterQuery<T>, undefined, defaultOptions as FilterQuery<IEntity>)
      return results.map((d) => this.toObject(d))
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}/find` })
    }
  }

  async findById(id: string | number): Promise<T | null> {
    try {
      const model = await this.model.findById(id)
      return model ? this.toObject(model) : null
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}/findById` })
    }
  }

  @ConvertMongoFilterToBaseRepository()
  async findOne<TFil = FilterQuery<T>, TQue = FilterQuery<IEntity>>(filter: TFil, options?: TQue): Promise<T | null> {
    try {
      const defaultOptions = { ...options }
      const data = await this.model.findOne(filter as FilterQuery<T>, undefined, defaultOptions as FilterQuery<IEntity>)
      return data ? this.toObject(data) : null
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}/findOne` })
    }
  }

  @ConvertMongoFilterToBaseRepository()
  async findAll<TFil = FilterQuery<T>, TOpt = FilterQuery<IEntity>>(filter?: TFil, options?: TOpt): Promise<T[]> {
    try {
      const defaultOptions = { ...options }
      const modelList = await this.model.find(
        filter as FilterQuery<T>,
        undefined,
        defaultOptions as FilterQuery<IEntity>
      )
      return modelList.map((d) => this.toObject(d))
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}/findAll` })
    }
  }

  @ConvertMongoFilterToBaseRepository()
  async remove<TQuery = FilterQuery<T>, TOpt = unknown>(filter: TQuery, options?: TOpt): Promise<RemovedModel> {
    try {
      const { deletedCount } = await this.model.deleteOne(filter as FilterQuery<T>, options || {})
      return { deletedCount: deletedCount || 0, deleted: !!deletedCount }
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}/remove` })
    }
  }

  @ConvertMongoFilterToBaseRepository()
  async updateOne<
    TQuery = FilterQuery<T>,
    TUpdate = UpdateWithAggregationPipeline | UpdateQuery<T>,
    TOptions = MongooseUpdateQueryOptions
  >(filter: TQuery, updated: TUpdate, options?: TOptions): Promise<UpdatedModel> {
    try {
      return await this.model.updateOne(
        filter as FilterQuery<T>,
        { $set: Object.assign({}, updated) },
        options as MongooseUpdateQueryOptions
      )
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}/updateOne` })
    }
  }

  @ConvertMongoFilterToBaseRepository()
  async findOneAndUpdate<TQuery = FilterQuery<T>, TUpdate = UpdateWithAggregationPipeline | UpdateQuery<T>>(
    filter: TQuery,
    updated: TUpdate,
    options: unknown = {}
  ): Promise<T | null> {
    try {
      const updateOptions = { ...(options as FilterQuery<IEntity>), new: true }

      const model = await this.model.findOneAndUpdate(
        filter as FilterQuery<T>,
        { $set: updated as UpdateWithAggregationPipeline | UpdateQuery<T> },
        updateOptions
      )

      return model ? this.toObject(model) : null
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}/findOneAndUpdate` })
    }
  }

  @ConvertMongoFilterToBaseRepository()
  async updateMany<
    TQuery = FilterQuery<T>,
    TUpdate = UpdateWithAggregationPipeline | UpdateQuery<T>,
    TOptions = MongooseUpdateQueryOptions
  >(filter: TQuery, updated: TUpdate, options?: TOptions): Promise<UpdatedModel> {
    try {
      return await this.model.updateMany(
        filter as FilterQuery<T>,
        { $set: updated as UpdateWithAggregationPipeline | UpdateQuery<T> },
        options as MongooseUpdateQueryOptions
      )
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}/updateMany` })
    }
  }

  async findIn<TOptions = FilterQuery<IEntity>>(
    input: { [key in keyof T]: string[] },
    options?: TOptions
  ): Promise<T[]> {
    try {
      const where: FilterQuery<IEntity> = {
        deletedAt: null
      }

      for (const key of Object.keys(input)) {
        where[key === 'id' ? '_id' : key] = { $in: (input as { [key: string]: unknown })[`${key}`] }
      }

      const defaultOptions = { ...options }
      const data = await this.model.find(where, undefined, defaultOptions as FilterQuery<IEntity>)
      return data.map((d) => this.toObject(d))
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}/findIn` })
    }
  }

  async findOr<TOptions = FilterQuery<IEntity>>(
    propertyList: (keyof T)[],
    value: string,
    options?: TOptions
  ): Promise<T[]> {
    try {
      const filter = propertyList.map((key) => {
        return { [key === 'id' ? '_id' : key]: value }
      })

      const defaultOptions = { ...options }
      const data = await this.model.find(
        { $or: filter as FilterQuery<T>[], deletedAt: null } as FilterQuery<IEntity>,
        undefined,
        defaultOptions as FilterQuery<IEntity>
      )
      return data.map((d) => this.toObject(d))
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}/findOr` })
    }
  }

  async findOneByCommands<TOptions = FilterQuery<IEntity>>(
    filterList: DatabaseOperationCommand<T>[],
    options?: TOptions
  ): Promise<T | null> {
    try {
      const searchList = this.buildCommandFilter(filterList)
      const defaultOptions = { ...options }
      const data = await this.model.findOne(searchList, undefined, defaultOptions as FilterQuery<IEntity>)
      return data ? this.toObject(data) : null
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}/findOneByCommands` })
    }
  }

  async findByCommands<TOptions = FilterQuery<IEntity>>(
    filterList: DatabaseOperationCommand<T>[],
    options?: TOptions
  ): Promise<T[]> {
    try {
      const searchList = this.buildCommandFilter(filterList)
      const defaultOptions = { ...options }
      const data = await this.model.find(searchList, undefined, defaultOptions as FilterQuery<IEntity>)
      return data.map((d) => this.toObject(d))
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}/findByCommands` })
    }
  }

  @ConvertMongoFilterToBaseRepository()
  async findOneWithExcludeFields<TQuery = FilterQuery<T>, TOptions = FilterQuery<IEntity>>(
    filter: TQuery,
    excludeProperties: Array<keyof T>,
    options?: TOptions
  ): Promise<T | null> {
    try {
      const exclude = excludeProperties.map((e) => `-${e.toString()}`)
      const defaultOptions = { ...options }

      const data = await this.model
        .findOne(filter as FilterQuery<T>, undefined, defaultOptions as FilterQuery<IEntity>)
        .select(exclude.join(' '))

      return data ? this.toObject(data) : null
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}/findOneWithExcludeFields` })
    }
  }

  async findAllWithExcludeFields<TQuery = FilterQuery<T>, TOptions = FilterQuery<IEntity>>(
    excludeProperties: Array<keyof T>,
    filter?: TQuery,
    options?: TOptions
  ): Promise<T[]> {
    try {
      const exclude = excludeProperties.map((e) => `-${e.toString()}`)
      const processedFilter = this.applyFilterWhenFilterParameterIsNotFirstOption(filter as FilterQuery<T>)
      const defaultOptions = { ...options }

      const data = await this.model
        .find(processedFilter, undefined, defaultOptions as FilterQuery<IEntity>)
        .select(exclude.join(' '))

      return data.map((d) => this.toObject(d))
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}/findAllWithExcludeFields` })
    }
  }

  @ConvertMongoFilterToBaseRepository()
  async findOneWithSelectFields<TQuery = FilterQuery<T>, TOptions = FilterQuery<IEntity>>(
    filter: TQuery,
    includeProperties: Array<keyof T>,
    options?: TOptions
  ): Promise<T | null> {
    try {
      const include = includeProperties.map((e) => `${e.toString()}`)
      const defaultOptions = { ...options }

      const data = await this.model
        .findOne(filter as FilterQuery<T>, undefined, defaultOptions as FilterQuery<IEntity>)
        .select(include.join(' '))

      return data ? this.toObject(data) : null
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}/findOneWithSelectFields` })
    }
  }

  @ConvertMongoFilterToBaseRepository()
  async findAllWithSelectFields<TQuery = FilterQuery<T>, TOptions = FilterQuery<IEntity>>(
    includeProperties: Array<keyof T>,
    filter?: TQuery,
    options?: TOptions
  ): Promise<T[]> {
    try {
      const include = includeProperties.map((e) => `${e.toString()}`)
      const processedFilter = this.applyFilterWhenFilterParameterIsNotFirstOption(filter as FilterQuery<T>)
      const defaultOptions = { ...options }

      const data = await this.model
        .find(processedFilter, undefined, defaultOptions as FilterQuery<IEntity>)
        .select(include.join(' '))

      return data.map((d) => this.toObject(d))
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}/findAllWithSelectFields` })
    }
  }

  @ConvertMongoFilterToBaseRepository()
  async findOneWithRelation<Filter = Partial<T>>(filter: Filter, joins?: JoinType<T>): Promise<T | null> {
    const populatePaths = this.getPopulatePaths(joins)

    const query = this.model.findOne(filter as FilterQuery<T>)

    const finalQuery = populatePaths.reduce((queryAccumulator, path) => queryAccumulator.populate(path), query)

    const data = await finalQuery.exec()
    if (!data) {
      return null
    }
    return data.toObject()
  }

  @ConvertMongoFilterToBaseRepository()
  async findAllWithRelation<Filter = Partial<T>>(filter?: Filter, joins?: JoinType<T>): Promise<T[]> {
    const populatePaths = this.getPopulatePaths(joins)

    const query = this.model.find(filter ?? {})

    const finalQuery = populatePaths.reduce((queryAccumulator, path) => queryAccumulator.populate(path), query)

    const data = await finalQuery.exec()

    if (!data.length) {
      return []
    }

    return data.map((d) => d.toObject())
  }

  @ConvertMongoFilterToBaseRepository()
  async exists<TQuery = Partial<T>>(filter: TQuery): Promise<boolean> {
    const result = await this.model.exists(filter as FilterQuery<T>)
    return !!result
  }

  @ConvertMongoFilterToBaseRepository()
  async existsOnUpdate<TQuery = Partial<T>>(filter: TQuery, id: string | number): Promise<boolean> {
    const query = { ...filter, _id: { $ne: id } }
    const result = await this.model.exists(query as FilterQuery<T>)
    return !!result
  }

  @ConvertMongoFilterToBaseRepository()
  async softRemove(entity: Partial<T>): Promise<T> {
    return (await this.findOneAndUpdate(
      entity as FilterQuery<T>,
      { deletedAt: DateUtils.now() } as UpdateQuery<T>
    )) as T
  }

  private getPopulatePaths(joins?: JoinType<T>): string[] {
    if (!joins) return []

    return Object.keys(joins).filter((key) => joins[key as keyof JoinType<T>] === true)
  }

  private buildCommandFilter(filterList: DatabaseOperationCommand<T>[]): FilterQuery<T> {
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
    return searchList as FilterQuery<T>
  }

  private applyFilterWhenFilterParameterIsNotFirstOption(filter?: FilterQuery<T>): FilterQuery<T> {
    if (!filter) {
      return { deletedAt: null } as unknown as FilterQuery<T>
    }

    const processedFilter = { ...filter } as Record<string, unknown>

    if (processedFilter.id) {
      processedFilter._id = processedFilter.id
      delete processedFilter.id
    }

    if (!processedFilter.deletedAt) {
      processedFilter.deletedAt = null
    }

    return processedFilter as FilterQuery<T>
  }

  private toObject(document: T, options: { virtuals?: boolean } = { virtuals: true }): T {
    return document.toObject({ virtuals: options.virtuals })
  }
}
