import { v4 as uuidv4 } from 'uuid';

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
    id: string;

    createdAt: Date;

    updatedAt: Date;

    deletedAt?: Date;

    static nameof = (name: keyof T) => name;

    setDeleted() {
      this.deletedAt = new Date();
    }
  }

  return Entity;
};
