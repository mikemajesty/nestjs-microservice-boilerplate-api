import { v4 as uuidv4 } from 'uuid';
import { ZodSchema, ZodType } from 'zod';

import { DateUtils } from './date';

export const withID = (entity: { _id?: string; id?: string }) => {
  entity.id = [entity?.id, entity?._id, uuidv4()].find(Boolean);
  return entity;
};

export interface IEntity {
  id: string;

  createdAt: Date;

  updatedAt: Date;

  deletedAt?: Date;
}

export const BaseEntity = <T>() => {
  abstract class Entity implements IEntity {
    schema: ZodSchema;

    constructor(schema: ZodSchema) {
      this.schema = schema;
    }

    readonly id: string;

    readonly createdAt: Date;

    readonly updatedAt: Date;

    deletedAt?: Date;

    static nameOf = (name: keyof T) => name;

    setDeleted() {
      this.deletedAt = DateUtils.getJSDate();
    }

    validate<T>(entity: T): ZodType {
      Object.assign(entity, withID(entity));
      Object.assign(this, { id: entity['id'] });
      return this.schema.parse(entity);
    }
  }

  return Entity;
};
