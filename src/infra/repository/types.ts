import { ClientSession, ObjectId } from 'mongoose'
import { EntityManager } from 'typeorm'

import { IEntity } from '@/utils/entity'
import { FieldQuery, FilterQuery } from '@/utils/mongoose'
import { AnyFunction } from '@/utils/types'

export type UpdatedModel = {
  matchedCount: number
  modifiedCount: number
  acknowledged: boolean
  upsertedId: unknown | ObjectId
  upsertedCount: number
}

export type RemovedModel = {
  deletedCount: number
  deleted: boolean
}

export type CreatedModel = {
  id: string
  created: boolean
}

export type CreatedOrUpdateModel = {
  id: string
  created: boolean
  updated: boolean
}

export type EntityConstructor<T extends IEntity> = new (entity: T) => T

export enum DatabaseOperationEnum {
  EQUAL = 'equal',
  NOT_EQUAL = 'not_equal',
  NOT_CONTAINS = 'not_contains',
  CONTAINS = 'contains'
}

export type DatabaseOperationCommand<T> = {
  property: keyof T
  value: unknown[]
  command: DatabaseOperationEnum
}

type JoinValue<T> = T extends infer U | undefined
  ? U extends Array<infer V>
    ? V extends IEntity
      ? boolean
      : never
    : U extends IEntity
      ? boolean
      : never
  : never

export type JoinType<T> = {
  [K in keyof T as T[K] extends AnyFunction ? never : JoinValue<T[K]> extends never ? never : K]?: JoinValue<T[K]>
}

/**
 * Same as `MakePartial<T>`, but excludes properties that represent entity relations
 * (fields that extend `IEntity`, directly or as an array), since relation filtering
 * should be handled explicitly by the user via `JoinType<T>` joins.
 */
export type MakePartialFilter<T> = {
  [K in keyof T as K extends '_schema'
    ? never
    : T[K] extends AnyFunction
      ? never
      : JoinValue<T[K]> extends never
        ? K
        : never]?: T[K]
}

type RelationKey<T> = {
  [K in keyof T]: T[K] extends AnyFunction ? never : JoinValue<T[K]> extends never ? never : K
}[keyof T]

/**
 * Same as `FilterQuery<T>`, but excludes properties that represent entity relations
 * (fields that extend `IEntity`, directly or as an array), since relation filtering
 * should be handled explicitly by the user via `JoinType<T>` joins.
 *
 * Note: built from scratch (not `Omit<FilterQuery<T>, ...>`) because `FilterQuery<T>`
 * carries a catch-all `[key: string]: AnyType` index signature that would otherwise
 * allow any omitted relation key to be re-added.
 */
export type FilterQueryFilter<T> = {
  [K in keyof T as K extends RelationKey<T> ? never : K]?: T[K] extends object
    ? FilterQuery<T[K]> | FieldQuery<T[K]>
    : FieldQuery<T[K]>
}

export type RunInTransactionType = EntityManager | ClientSession
