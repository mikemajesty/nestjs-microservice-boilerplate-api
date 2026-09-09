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
  abstract class Entity implements IEntity, IDomainEventPublisher {
    protected constructor(readonly _schema: z.ZodType) {
      if (!_schema) {
        throw new ApiUnprocessableEntityException(`${this.constructor.name} required a schema`)
      }
      this.ensureTimestamps()
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
      this.deletedAt = DateUtils.now()
      this.touch()
      return this
    }

    activate(): this {
      this.deletedAt = null
      this.touch()
      return this
    }

    validate<EntityInput>(entity: EntityInput): EntityInput {
      normalizeID(entity as IEntity)
      const parsed = this._schema.parse(entity) as EntityInput
      Object.assign(this, parsed)
      this.ensureTimestamps()
      return parsed
    }

    ensureID(type?: IDGeneratorType, options?: IDGeneratorTypes): this {
      if (!this.id) {
        const id = IDGeneratorUtils.generators[type || 'uuid'](options)
        Object.assign(this, { id })
      }

      return this
    }

    toObject(): T {
      return this._schema.safeParse({ ...this, _schema: undefined }).data as T
    }

    clone(): this {
      const obj = this.toObject()
      const Constructor = this.constructor as new (entity: T) => this
      return new Constructor(obj as T)
    }

    merge(partial: Partial<T>): this {
      const current = this.toObject()
      const merged = { ...current, ...partial }
      this.validate(merged)
      this.touch()
      return this
    }

    ensureTimestamps(): void {
      const now = DateUtils.now({ type: 'js' }) as Date
      if (!this.createdAt) this.createdAt = now
      if (!this.updatedAt) this.updatedAt = now
    }

    touch(): void {
      this.updatedAt = DateUtils.now({ type: 'js' }) as Date
    }

    addEvent<R>(event: AddEventInput<R>): void {
      const domainEvent: DomainEvent<R> = {
        ...event,
        occurredAt: DateUtils.now()
      }
      eventsMap.get(this)!.push(domainEvent)
    }

    getEvents<R>(): DomainEvent<R>[] {
      return [...(eventsMap.get(this) as DomainEvent<R>[])]
    }

    releaseEvents<R>(): DomainEvent<R>[] {
      const events = this.getEvents<R>()
      this.clearEvents()
      return events
    }

    clearEvents(): void {
      eventsMap.set(this, [])
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

export interface IDomainEventPublisher {
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
