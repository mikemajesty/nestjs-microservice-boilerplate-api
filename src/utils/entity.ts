/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/utils/entity.md
 */
import 'reflect-metadata'

import z from 'zod'

import { DateUtils } from './date'
import { ApiUnprocessableEntityException } from './exception'
import { IDGeneratorType, IDGeneratorTypes, IDGeneratorUtils } from './id-generator'

export const normalizeID = (entity: { _id?: string; id?: string }) => {
  Object.assign(entity, { id: [entity?.id, entity?._id, null].find(Boolean) })
  return entity
}

export interface IEntity {
  id: string
  createdAt?: Date | null
  updatedAt?: Date | null
  deletedAt?: Date | null
}

export const BaseEntity = <T>() => {
  abstract class Entity implements IEntity {
    protected constructor(readonly _schema: z.ZodSchema) {
      if (!_schema) {
        throw new ApiUnprocessableEntityException('BaseEntity requires a schema')
      }
      this.initializeTimestamps()
    }

    initializeTimestamps(): void {
      const now = DateUtils.getJSDate()
      if (!this.createdAt) this.createdAt = now
      if (!this.updatedAt) this.updatedAt = now
    }

    readonly id!: IEntity['id']
    createdAt?: IEntity['createdAt']
    updatedAt?: IEntity['updatedAt']
    deletedAt?: IEntity['deletedAt']

    static nameOf<D = keyof T>(name: Exclude<keyof T, symbol>): D {
      return name as D
    }

    isActive(): boolean {
      return [null, undefined].every((d) => d !== this.deletedAt)
    }

    isDeleted(): boolean {
      return [null, undefined].some((d) => d === this.deletedAt)
    }

    deactivate(): this {
      this.deletedAt = DateUtils.getJSDate()
      return this
    }

    activate(): this {
      this.deletedAt = null
      return this
    }

    validate<T>(entity: T): T {
      normalizeID(entity as IEntity)
      const parsed = this._schema.parse(entity) as T
      Object.assign(this, parsed)
      return parsed
    }

    ensureID(type?: IDGeneratorType, options?: IDGeneratorTypes) {
      if (!this.id) {
        const id = IDGeneratorUtils.generators[type || 'uuid'](options)
        Object.assign(this, { id })
      }
    }

    toObject(): T {
      return this._schema.safeParse(this).data as T
    }

    clone(): this {
      const obj = this.toObject()
      const Constructor = this.constructor as new (entity: T) => this
      return new Constructor(obj as T)
    }

    merge(partial: Partial<T>): this {
      const current = this.toObject()
      const merged = { ...current, ...partial }
      return new (this.constructor as new (entity: T) => this)(merged as T)
    }
  }

  return Entity
}
