import 'reflect-metadata';

import z from 'zod';

import { DateUtils } from './date';
import { ApiUnprocessableEntityException } from './exception';
import { IDGeneratorType, IDGeneratorTypes, IDGeneratorUtils } from './id-generator';

export const setEntityID = (entity: { _id?: string; id?: string }) => {
  Object.assign(entity, { id: [entity?.id, entity?._id, null].find(Boolean) });
  return entity;
};

export interface IEntity {
  id: string;

  createdAt?: Date | null | undefined;

  updatedAt?: Date | null | undefined;

  deletedAt?: Date | null | undefined;
}

export const BaseEntity = <T>() => {
  abstract class Entity implements IEntity {
    protected constructor(readonly _schema: z.ZodSchema) {
      if (!_schema) {
        throw new ApiUnprocessableEntityException('BaseEntity requires a schema');
      }
    }

    readonly id!: string;

    readonly createdAt?: Date | null | undefined;

    readonly updatedAt?: Date | null | undefined;

    deletedAt?: Date | null | undefined;

    static nameOf = <D = keyof T>(name: keyof T) => name as D;

    deactivated() {
      this.deletedAt = DateUtils.getJSDate();
    }

    activated() {
      Object.assign(this, { deletedAt: null });
    }

    validate<T>(entity: T): T {
      setEntityID(entity as IEntity);
      const parsed = this._schema.parse(entity) as T;
      Object.assign(this, parsed);
      return parsed;
    }

    assignIDWhenMissing(type?: IDGeneratorType, options?: IDGeneratorTypes) {
      if (!this.id) {
        const id = IDGeneratorUtils.generators[type || 'uuid'](options);
        Object.assign(this, { id });
      }
    }

    toObject() {
      return this._schema.safeParse(this).data as T;
    }

    toJson() {
      return JSON.stringify(this.toObject());
    }

    clone(): this {
      const obj = this.toObject();
      return new (this.constructor as new (entity: T) => this)(obj);
    }
  }

  return Entity;
};
