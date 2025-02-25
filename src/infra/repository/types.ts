import { ObjectId } from 'mongoose';

export type UpdatedModel = {
  matchedCount: number;
  modifiedCount: number;
  acknowledged: boolean;
  upsertedId: unknown | ObjectId;
  upsertedCount: number;
};

export type RemovedModel = {
  deletedCount: number;
  deleted: boolean;
};

export type CreatedModel = {
  id: string;
  created: boolean;
};

export type CreatedOrUpdateModel = {
  id: string;
  created: boolean;
  updated: boolean;
};

export enum DatabaseOperationEnum {
  EQUAL = 'equal',
  NOT_EQUAL = 'not_equal',
  NOT_CONTAINS = 'not_contains',
  CONTAINS = 'contains'
}

export type DatabaseOperationCommand<T> = {
  property: keyof T;
  value: unknown[];
  command: DatabaseOperationEnum;
};
