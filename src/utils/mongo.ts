import { Document, FilterQuery } from 'mongoose';

export const convertMongoFilter = <T extends Document>(filterList: FilterQuery<T>[]) => {
  for (const filter of filterList) {
    if (!filter) {
      continue;
    }

    if (filter.id) {
      filter._id = filter.id;
      delete filter.id;
    }
  }
};
