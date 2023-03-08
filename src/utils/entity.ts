import { v4 as uuidv4 } from 'uuid';

export const withID = (entity: any): unknown => {
  entity.id = [entity?.id, entity?._id, uuidv4()].find(Boolean);
  return entity;
};

export interface IEntity {
  id: string;

  createdAt: Date;

  updatedAt: Date;
}
