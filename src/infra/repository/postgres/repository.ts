/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/infra/repository.md
 */
import {
  BaseEntity,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  FindOptionsOrder,
  FindOptionsSelect,
  FindOptionsWhere,
  In,
  IsNull,
  Not,
  Raw,
  Repository,
  SaveOptions
} from 'typeorm'

import { IEntity } from '@/utils/entity'
import { ApiInternalServerException } from '@/utils/exception'
import { PaginationInput, PaginationOutput, PaginationUtils } from '@/utils/pagination'
import { MakePartial } from '@/utils/types'

import { IRepository } from '../adapter'
import {
  CreatedModel,
  CreatedOrUpdateModel,
  DatabaseOperationCommand,
  EntityConstructor,
  JoinType,
  MakePartialFilter,
  RemovedModel,
  UpdatedModel
} from '../types'
import { createRelations, handleDatabaseError } from '../util'

export class TypeORMRepository<
  TModel extends BaseEntity & IEntity = BaseEntity & IEntity,
  TEntity extends IEntity = TModel
> implements IRepository<TEntity> {
  private readonly context: string = TypeORMRepository.name

  constructor(
    readonly repository: Repository<TModel>,
    private readonly Entity: EntityConstructor<TEntity>
  ) {}

  async runInTransaction<R>(fn: (manager: EntityManager) => Promise<R>): Promise<R> {
    const queryRunner = this.repository.manager.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()
    try {
      const result = await fn(queryRunner.manager)
      await queryRunner.commitTransaction()
      return result
    } catch (err) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction()
      }
      throw handleDatabaseError({ error: err, context: `${this.context}.runInTransaction` })
    } finally {
      await queryRunner.release()
    }
  }

  async applyPagination<R>(input: PaginationInput<R>, joins?: JoinType<TEntity>): Promise<PaginationOutput<TEntity>> {
    const skip = PaginationUtils.calculateSkip(input)

    const relations = createRelations(joins)

    const [docs, total] = await this.repository.findAndCount({
      take: input.limit,
      skip,
      order: input.sort as FindOptionsOrder<TModel>,
      where: input.search as FindOptionsWhere<TModel>,
      relations: relations as FindManyOptions<TModel>['relations']
    })

    return {
      docs: this.hydrateAll(docs),
      total,
      page: input.page,
      limit: input.limit,
      totalPages: PaginationUtils.calculateTotalPages({ limit: input.limit, total })
    }
  }

  async findOr(propertyList: (keyof TEntity)[], value: string): Promise<TEntity[]> {
    const filter = propertyList.map((property) => {
      return { [property]: value }
    })

    Object.assign(filter, { deletedAt: null })
    const models = await this.repository.find({
      where: filter as FindOptionsWhere<TModel>[] | FindOptionsWhere<TModel>
    })
    return this.hydrateAll(models)
  }

  async create<TOptions = SaveOptions>(document: TEntity, saveOptions?: TOptions): Promise<CreatedModel> {
    try {
      const entity = this.repository.create(document as unknown as TModel)
      const model = await entity.save(saveOptions as SaveOptions)
      return { created: model.hasId(), id: model.id }
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}.create` })
    }
  }

  async findById(id: string): Promise<TEntity | null> {
    const model = await this.repository.findOne({ where: { id } } as FindOneOptions<TModel>)
    return model ? this.hydrate(model) : null
  }

  async insertMany(document: TEntity[]): Promise<void> {
    await this.repository.insert(document as object[])
  }

  async createOrUpdate<TUpdate = MakePartial<TEntity>>(updated: TUpdate): Promise<CreatedOrUpdateModel> {
    try {
      const documentEntity: IEntity = updated as IEntity
      if (!documentEntity?.id) {
        throw new ApiInternalServerException('id is required', { context: `${TypeORMRepository.name}.createOrUpdate` })
      }

      const exists = await this.findById(documentEntity.id)

      if (!exists) {
        const created = await this.create(updated as unknown as TEntity)

        return { id: created.id, created: true, updated: false }
      }

      const row = await this.repository.update({ id: exists.id } as FindOptionsWhere<TModel>, updated as object)

      return { id: exists.id, created: false, updated: (row.affected || 0) > 0 }
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}.createOrUpdate` })
    }
  }

  async findAll(): Promise<TEntity[]> {
    return this.hydrateAll(await this.repository.find())
  }

  async find<TQuery = MakePartialFilter<TEntity>>(filter: TQuery): Promise<TEntity[]> {
    const models = await this.repository.find({
      where: { ...filter, deletedAt: null }
    } as FindOneOptions<TModel>)
    return this.hydrateAll(models)
  }

  async findIn(filter: { [key in keyof MakePartialFilter<TEntity>]: string[] }): Promise<TEntity[]> {
    const where: { [key: string]: unknown } = {
      deletedAt: IsNull()
    }

    for (const key of Object.keys(filter)) {
      where[key] = In((filter as { [key: string]: string[] })[key])
    }

    const models = await this.repository.find({
      where
    } as FindOneOptions<TModel>)
    return this.hydrateAll(models)
  }

  async findOneByCommands(filterList: DatabaseOperationCommand<TEntity>[]): Promise<TEntity | null> {
    const searchList: { [key: string]: unknown } = {}

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
    }

    for (const filter of filterList) {
      searchList[`${filter.property.toString()}`] = postgresSearch[filter.command].query(filter.value)
    }

    const result = await this.repository.findOne({
      where: searchList
    } as FindOneOptions<TModel>)

    if (!result) {
      return null
    }

    return this.hydrate(result)
  }

  async findByCommands(filterList: DatabaseOperationCommand<TEntity>[]): Promise<TEntity[]> {
    const searchList: { [key: string]: unknown } = {}

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
    }

    for (const filter of filterList) {
      searchList[`${filter.property.toString()}`] = postgresSearch[filter.command].query(filter.value)
    }

    const models = await this.repository.find({
      where: searchList
    } as FindOneOptions<TModel>)
    return this.hydrateAll(models)
  }

  async remove<TQuery = MakePartialFilter<TEntity>>(filter: TQuery): Promise<RemovedModel> {
    try {
      const data = await this.repository.delete(filter as FindOptionsWhere<TModel>)
      return { deletedCount: data.affected || 0, deleted: !!data.affected }
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}.remove` })
    }
  }

  async findOne<TQuery = MakePartialFilter<TEntity>>(filter: TQuery): Promise<TEntity | null> {
    const model = await this.repository.findOne({
      where: filter
    } as FindOneOptions<TModel>)
    return model ? this.hydrate(model) : null
  }

  async updateOne<TQuery = MakePartialFilter<TEntity>, TUpdate = MakePartial<TEntity>>(
    filter: TQuery,
    updated: TUpdate
  ): Promise<UpdatedModel> {
    try {
      const data = await this.repository.update(filter as FindOptionsWhere<TModel>, Object.assign({}, updated))
      return {
        modifiedCount: data.affected || 0,
        upsertedCount: 0,
        upsertedId: 0,
        matchedCount: data.affected || 0,
        acknowledged: !!data.affected
      }
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}.updateOne` })
    }
  }

  async findOneAndUpdate<TQuery = MakePartialFilter<TEntity>, TUpdate = MakePartial<TEntity>>(
    filter: TQuery,
    updated: TUpdate
  ): Promise<TEntity | null> {
    await this.repository.update(filter as FindOptionsWhere<TModel>, updated as object)

    return this.findOne(filter)
  }

  async updateMany<TQuery = MakePartialFilter<TEntity>, TUpdate = MakePartial<TEntity>>(
    filter: TQuery,
    updated: TUpdate
  ): Promise<UpdatedModel> {
    try {
      const data = await this.repository.update(filter as FindOptionsWhere<TModel>, updated as object)
      return {
        modifiedCount: data.affected || 0,
        upsertedCount: 0,
        upsertedId: 0,
        matchedCount: data.affected || 0,
        acknowledged: !!data.affected
      }
    } catch (error) {
      throw handleDatabaseError({ error, context: `${this.context}.updateMany` })
    }
  }

  async findOneWithSelectFields<TQuery = MakePartialFilter<TEntity>>(
    filter: TQuery,
    includeProperties: (keyof TEntity)[]
  ): Promise<TEntity | null> {
    const select = includeProperties.map((e) => `${e.toString()}`) as (keyof TModel)[]
    const model = await this.repository.findOne({
      where: filter as FindOptionsWhere<TModel>,
      select: this.createSelect(select)
    })
    return model ? this.hydrate(model) : null
  }

  async findAllWithSelectFields<TQuery = MakePartialFilter<TEntity>>(
    includeProperties: (keyof TEntity)[],
    filter?: TQuery
  ): Promise<TEntity[]> {
    const select = includeProperties.map((e) => `${e.toString()}`) as (keyof TModel)[]
    const models = await this.repository.find({
      where: filter as FindOptionsWhere<TModel>,
      select: this.createSelect(select)
    })
    return this.hydrateAll(models)
  }

  async findOneWithExcludeFields(filter: unknown, excludeProperties: (keyof TEntity)[]): Promise<TEntity | null> {
    const select = excludeProperties.map((e) => `${e.toString()}`)
    const model = await this.repository.findOne({
      where: filter as FindOptionsWhere<TModel>,
      select: this.excludeColumns(select)
    })
    return model ? this.hydrate(model) : null
  }

  async findAllWithExcludeFields<TQuery = MakePartialFilter<TEntity>>(
    excludeProperties: (keyof TEntity)[],
    filter?: TQuery
  ): Promise<TEntity[]> {
    const select = excludeProperties.map((e) => `${e.toString()}`)
    const models = await this.repository.find({
      where: filter as FindOptionsWhere<TModel>,
      select: this.excludeColumns(select)
    })
    return this.hydrateAll(models)
  }

  async findOneWithRelation<Filter = MakePartialFilter<TEntity>>(
    filter: Filter,
    joins?: JoinType<TEntity>
  ): Promise<TEntity | null> {
    const relations = createRelations(joins)

    const options: FindOneOptions<TModel> = {
      where: filter as FindOptionsWhere<TModel>
    }

    if (Object.keys(relations).length > 0) {
      options.relations = relations as FindOneOptions<TModel>['relations']
    }

    const model = await this.repository.findOne(options)
    return model ? this.hydrate(model) : null
  }

  async findAllWithRelation<Filter = MakePartialFilter<TEntity>>(
    filter?: Filter,
    joins?: JoinType<TEntity>
  ): Promise<TEntity[]> {
    const relations = createRelations(joins)

    const where: FindOptionsWhere<TModel> = {
      deletedAt: null,
      ...(filter as FindOptionsWhere<TModel>)
    } as FindOptionsWhere<TModel>

    const options: FindManyOptions<TModel> = { where }

    if (Object.keys(relations).length > 0) {
      options.relations = relations as FindManyOptions<TModel>['relations']
    }

    return this.hydrateAll(await this.repository.find(options))
  }

  async exists<TQuery = MakePartialFilter<TEntity>>(filter: TQuery): Promise<boolean> {
    const result = await this.repository.exists({ where: filter as FindOptionsWhere<TModel> })
    return result
  }

  async existsOnUpdate<TQuery = MakePartialFilter<TEntity>>(filter: TQuery, id: string | number): Promise<boolean> {
    const result = await this.repository.exists({
      where: { ...filter, id: Not(id) } as FindOptionsWhere<TModel>
    })
    return result
  }

  async softRemove(entity: MakePartialFilter<TEntity>): Promise<TEntity> {
    const model = await this.repository.findOne({
      where: entity as unknown as FindOptionsWhere<TModel>
    })

    if (!model) {
      throw new ApiInternalServerException('entity not found', { context: `${this.context}.softRemove` })
    }

    return this.hydrate(await this.repository.softRemove(model))
  }

  protected hydrate(model: TModel): TEntity {
    if (!this.Entity || model instanceof this.Entity) {
      return model as unknown as TEntity
    }
    return new this.Entity(model as unknown as TEntity)
  }

  private hydrateAll(models: TModel[]): TEntity[] {
    return models.map((model) => this.hydrate(model))
  }

  private createSelect(includeProperties: (keyof TModel)[]): FindOptionsSelect<TModel> {
    if (includeProperties.length === 0) {
      return {}
    }
    const select: Record<string, boolean> = {}

    includeProperties.forEach((property) => {
      select[String(property)] = true
    })

    return select as FindOptionsSelect<TModel>
  }

  private excludeColumns(columnsToExclude: string[]): FindOptionsSelect<TModel> {
    const excludeSet = new Set(columnsToExclude)
    const select: Record<string, boolean> = {}

    this.repository.metadata.columns.forEach((column) => {
      const columnName = column.databaseName
      if (!excludeSet.has(columnName)) {
        select[columnName] = true
      }
    })

    return select as FindOptionsSelect<TModel>
  }
}
