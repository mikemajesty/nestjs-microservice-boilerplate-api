/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/infra/repository.md
 */
import { PaginationInput, PaginationOutput } from '@/utils/pagination'

import {
  CreatedModel,
  CreatedOrUpdateModel,
  DatabaseOperationCommand,
  JoinType,
  RemovedModel,
  RunInTransactionType,
  UpdatedModel
} from './types'

export abstract class IRepository<T> {
  /**
   * Applies pagination to a query.
   * @param input Pagination and filter parameters.
   * @returns Paginated result.
   * @example
   *   const result = await repo.applyPagination({ page: 1, limit: 10, filter: {} });
   */
  abstract applyPagination(input: PaginationInput<T>): Promise<PaginationOutput<T>>

  /**
   * Executes a function within a database transaction.
   * @param fn Async function to be executed in the transaction.
   * @returns The result of the executed function.
   * @example
   *   await repo.runInTransaction(async (ctx) => {
   *     await repo.create({ name: 'foo' });
   *     await repo.updateOne({ id: '1' }, { name: 'bar' });
   *   });
   */
  abstract runInTransaction<R>(fn: (context: RunInTransactionType) => Promise<R>): Promise<R>

  /**
   * Creates a new document.
   * @param document Document to be created.
   * @param saveOptions Additional save options.
   * @returns Created model.
   * @example
   *   await repo.create({ name: 'foo' })
   */
  abstract create<TOptions = unknown>(document: T, saveOptions?: TOptions): Promise<CreatedModel>

  /**
   * Creates or updates a document.
   * @param updated Data to update or create.
   * @param options Additional options.
   * @returns Created or updated model.
   * @example
   *   await repo.createOrUpdate({ id: 1, name: 'bar' })
   */
  abstract createOrUpdate<TUpdate = Partial<T>, TOptions = unknown>(
    updated: TUpdate,
    options?: TOptions
  ): Promise<CreatedOrUpdateModel>

  /**
   * Inserts multiple documents.
   * @param document List of documents.
   * @param saveOptions Additional options.
   * @example
   *   await repo.insertMany([{ name: 'a' }, { name: 'b' }])
   */
  abstract insertMany<TOptions = unknown>(document: T[], saveOptions?: TOptions): Promise<void>

  /**
   * Finds a document by its ID.
   * @param id Document identifier.
   * @param options Additional options.
   * @returns Found document or null.
   * @example
   *   const doc = await repo.findById('123')
   */
  abstract findById<TOpt = unknown>(id: string | number, options?: TOpt): Promise<T | null>

  /**
   * Finds all documents matching the filter.
   * @param filter Query filter.
   * @param opt Additional options.
   * @returns List of documents.
   * @example
   *   const docs = await repo.findAll({ active: true })
   */
  abstract findAll<TQuery = Partial<T>, TOpt = unknown>(filter?: TQuery, opt?: TOpt): Promise<T[]>

  /**
   * Finds documents by filter.
   * @param filter Query filter.
   * @param options Additional options.
   * @returns List of documents.
   * @example
   *   const docs = await repo.find({ name: 'foo' })
   *   // Find with multiple fields
   *   const docs2 = await repo.find({ name: 'foo', active: true })
   */
  abstract find<TQuery = Partial<T>, TOptions = unknown>(filter: TQuery, options?: TOptions | null): Promise<T[]>

  /**
   * Finds documents where the specified fields are in a list of values.
   * @param filter Object with arrays of values per field.
   * @param options Additional options.
   * @returns List of documents.
   * @example
   *   await repo.findIn({ id: ['1', '2'] })
   *   await repo.findIn({ status: ['active', 'pending'] })
   */
  abstract findIn<TOptions = unknown>(
    filter: { [key in keyof Partial<T>]: string[] },
    options?: TOptions | null
  ): Promise<T[]>

  /**
   * Finds documents where at least one of the specified fields matches the value.
   * @param propertyList List of properties.
   * @param value Value to search for.
   * @param options Additional options.
   * @returns List of documents.
   * @example
   *   await repo.findOr(['email', 'username'], 'foo@bar.com')
   *   await repo.findOr(['cpf', 'cnpj'], '12345678900')
   */
  abstract findOr<TOptions = unknown>(
    propertyList: Array<keyof Partial<T>>,
    value: string,
    options?: TOptions
  ): Promise<T[]>

  /**
   * Finds documents using custom operation commands.
   * @param filterList List of commands.
   * @param options Additional options.
   * @returns List of documents.
   * @example
   *   await repo.findByCommands([
   *     { property: 'age', value: [18], command: DatabaseOperationEnum.EQUAL },
   *     { property: 'status', value: ['active', 'pending'], command: DatabaseOperationEnum.CONTAINS }
   *   ])
   */
  abstract findByCommands<TOptions = unknown>(
    filterList: DatabaseOperationCommand<T>[],
    options?: TOptions | null
  ): Promise<T[]>

  /**
   * Finds a document using custom operation commands.
   * @param filterList List of commands.
   * @param options Additional options.
   * @returns Found document or null.
   * @example
   *   await repo.findOneByCommands([
   *     { property: 'email', value: ['foo@bar.com'], command: DatabaseOperationEnum.EQUAL }
   *   ])
   */
  abstract findOneByCommands<TOptions = unknown>(
    filterList: DatabaseOperationCommand<T>[],
    options?: TOptions | null
  ): Promise<T | null>

  /**
   * Removes documents matching the filter.
   * @param filter Removal filter.
   * @param opt Additional options.
   * @returns Removed model.
   * @example
   *   await repo.remove({ id: '123' })
   */
  abstract remove<TQuery = Partial<T>, TOpt = unknown>(filter: TQuery, opt?: TOpt): Promise<RemovedModel>

  /**
   * Finds a document matching the filter.
   * @param filter Query filter.
   * @param options Additional options.
   * @returns Found document or null.
   * @example
   *   await repo.findOne({ email: 'foo@bar.com' })
   *   await repo.findOne({ id: '123', active: true })
   */
  abstract findOne<TQuery = Partial<T>, TOptions = unknown>(filter: TQuery, options?: TOptions): Promise<T | null>

  /**
   * Updates a document matching the filter.
   * @param filter Query filter.
   * @param updated Data to update.
   * @param options Additional options.
   * @returns Updated model.
   * @example
   *   await repo.updateOne({ id: '1' }, { name: 'novo' })
   */
  abstract updateOne<TQuery = Partial<T>, TUpdate = Partial<T>, TOptions = unknown>(
    filter: TQuery,
    updated: TUpdate,
    options?: TOptions
  ): Promise<UpdatedModel>

  /**
   * Finds and updates a document.
   * @param filter Query filter.
   * @param updated Data to update.
   * @param options Additional options.
   * @returns Updated document or null.
   * @example
   *   await repo.findOneAndUpdate({ id: '1' }, { name: 'novo' })
   */
  abstract findOneAndUpdate<TQuery = Partial<T>, TUpdate = Partial<T>, TOptions = unknown>(
    filter: TQuery,
    updated: TUpdate,
    options?: TOptions
  ): Promise<T | null>

  /**
   * Updates multiple documents.
   * @param filter Query filter.
   * @param updated Data to update.
   * @param options Additional options.
   * @returns Updated model.
   * @example
   *   await repo.updateMany({ active: true }, { active: false })
   */
  abstract updateMany<TQuery = Partial<T>, TUpdate = Partial<T>, TOptions = unknown>(
    filter: TQuery,
    updated: TUpdate,
    options?: TOptions
  ): Promise<UpdatedModel>

  /**
   * Finds a document excluding specific fields.
   * @param filter Query filter.
   * @param excludeProperties Properties to exclude.
   * @param options Additional options.
   * @returns Found document or null.
   * @example
   *   await repo.findOneWithExcludeFields({ id: '123' }, ['password', 'token'])
   */
  abstract findOneWithExcludeFields<TQuery = Partial<T>, TOptions = unknown>(
    filter: TQuery,
    excludeProperties: Array<keyof T>,
    options?: TOptions
  ): Promise<T | null>

  /**
   * Finds all documents excluding specific fields.
   * @param excludeProperties Properties to exclude.
   * @param filter Query filter.
   * @param options Additional options.
   * @returns List of documents.
   * @example
   *   await repo.findAllWithExcludeFields(['password'], { active: true })
   */
  abstract findAllWithExcludeFields<TQuery = Partial<T>, TOptions = unknown>(
    excludeProperties: Array<keyof T>,
    filter?: TQuery | null,
    options?: TOptions
  ): Promise<T[]>

  /**
   * Finds a document including only specific fields.
   * @param filter Query filter.
   * @param includeProperties Properties to include.
   * @param options Additional options.
   * @returns Found document or null.
   * @example
   *   await repo.findOneWithSelectFields({ id: '123' }, ['name', 'email'])
   */
  abstract findOneWithSelectFields<TQuery = Partial<T>, TOptions = unknown>(
    filter: TQuery,
    includeProperties: Array<keyof T>,
    options?: TOptions
  ): Promise<T | null>

  /**
   * Finds all documents including only specific fields.
   * @param includeProperties Properties to include.
   * @param filter Query filter.
   * @param options Additional options.
   * @returns List of documents.
   * @example
   *   await repo.findAllWithSelectFields(['name', 'email'], { active: true })
   */
  abstract findAllWithSelectFields<TQuery = Partial<T>, TOptions = unknown>(
    includeProperties: Array<keyof T>,
    filter?: TQuery | null,
    options?: TOptions
  ): Promise<T[]>

  /**
   * Finds a document with join on other entities.
   * @param filter Query filter.
   * @param joins Join configuration.
   * @returns Found document or null.
   * @example
   *   await repo.findOneWithRelation({ id: '123' }, { profile: true })
   */
  abstract findOneWithRelation<Filter = Partial<T>>(filter: Filter, joins?: JoinType<T>): Promise<T | null>

  /**
   * Finds all documents with join on other entities.
   * @param filter Query filter.
   * @param joins Join configuration.
   * @returns List of documents.
   * @example
   *   await repo.findAllWithRelation({ active: true }, { profile: true, roles: ['name'] })
   */
  abstract findAllWithRelation<Filter = Partial<T>>(filter?: Filter, joins?: JoinType<T>): Promise<T[]>

  /**
   * Checks if a document exists matching the filter.
   * @param filter Query filter.
   * @returns true if exists, false otherwise.
   * @example
   *   const exists = await repo.exists({ email: 'foo@bar.com' })
   */
  abstract exists<TQuery = Partial<T>>(filter: TQuery): Promise<boolean>

  /**
   * Checks if a document exists (except the given id) matching the filter.
   * @param filter Query filter.
   * @param id ID to ignore.
   * @returns true if exists, false otherwise.
   */
  abstract existsOnUpdate<TQuery = Partial<T>>(filter: TQuery, id: string | number): Promise<boolean>

  /**
   * Performs a logical (soft) delete of the document.
   * @param entity Entity to be removed.
   * @returns Removed entity.
   * @example
   *   await repo.softRemove({ id: '123' })
   */
  abstract softRemove(entity: Partial<T>): Promise<T>
}
