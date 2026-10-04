import { ClientSession, ObjectId } from 'mongoose'
import { EntityManager } from 'typeorm'

import { IEntity } from '@/utils/entity'

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
      ? boolean | (keyof V)[]
      : never
    : U extends IEntity
      ? boolean | (keyof U)[]
      : never
  : never

export type JoinType<T> = {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  [K in keyof T as T[K] extends Function ? never : JoinValue<T[K]> extends never ? never : K]?: JoinValue<T[K]>
}
export type RunInTransactionType = EntityManager | ClientSession
