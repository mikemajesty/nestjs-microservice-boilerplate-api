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

export const BaseEntity = <T>() => {
  const eventsMap = new WeakMap<object, DomainEvent<unknown>[]>()
  abstract class Entity implements IEntity, IEvents {
    protected constructor(readonly _schema: z.ZodSchema) {
      if (!_schema) {
        throw new ApiUnprocessableEntityException(`${this.constructor.name} required a schema`)
      }
      this.initializeTimestamps()
      this.clearEvents()
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

    addEvent<R>(event: AddEventInput<R>): void {
      const domainEvent: DomainEvent<R> = {
        ...event,
        occurredAt: DateUtils.getJSDate()
      }
      eventsMap.get(this)!.push(domainEvent)
    }

    getEvents<R>(): DomainEvent<R>[] {
      return eventsMap.get(this) as DomainEvent<R>[]
    }

    releaseEvents<R>(): DomainEvent<R>[] {
      const events = this.getEvents<R>()
      this.clearEvents()
      return events
    }

    clearEvents(): void {
      eventsMap.set(this, [])
    }

    initializeTimestamps(): void {
      const now = DateUtils.getJSDate()
      if (!this.createdAt) this.createdAt = now
      this.updatedAt = now
    }
  }
  return Entity
}

export interface IEntity {
  id: string
  createdAt?: Date | null
  updatedAt?: Date | null
  deletedAt?: Date | null
}

export interface IEvents {
  addEvent<T>(event: AddEventInput<T>): void
  getEvents<T>(): DomainEvent<T>[]
  releaseEvents<T>(): DomainEvent<T>[]
  clearEvents(): void
}

export type DomainEvent<T> = {
  name: string
  payload: T
  occurredAt: Date
}

type AddEventInput<T> = Omit<DomainEvent<T>, 'occurredAt'>
