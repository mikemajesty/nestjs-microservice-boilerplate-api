import 'reflect-metadata';

import z from 'zod';

import { DateUtils } from './date';
import { ApiUnprocessableEntityException } from './exception';
import { UUIDUtils } from './uuid';

export const withID = (entity: { _id?: string; id?: string }) => {
  Object.assign(entity, { id: [entity?.id, entity?._id, UUIDUtils.create()].find(Boolean) });
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
      Object.assign(entity as IEntity, withID(entity as IEntity));
      Object.assign(this, { id: (entity as Pick<IEntity, 'id'>).id });
      return this._schema.parse(entity) as T;
    }

    toObject() {
      return this._schema.safeParse(this).data as T;
    }

    toJson() {
      return JSON.stringify(this.toObject());
    }
  }

  return Entity;
};
