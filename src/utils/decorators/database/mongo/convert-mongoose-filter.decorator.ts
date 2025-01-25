import { FilterQuery, RootFilterQuery } from 'mongoose';

import { IEntity } from '@/utils/entity';

export function ConvertMongoFilterToBaseRepository() {
  return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: { id?: string }[]) {
      const input: RootFilterQuery<IEntity> = args[0];

      if (!input) {
        const result = originalMethod.apply(this, args);
        return result;
      }

      input.deletedAt = null;

      if (input.id) {
        input._id = input.id;
        delete input.id;
      }

      args[0] = convertObjectFilterToMongoFilter(input);
      const result = originalMethod.apply(this, args);
      return result;
    };
  };
}

const convertObjectFilterToMongoFilter = (input: FilterQuery<IEntity>) => {
  const filterFormated: { [key: string]: unknown } = {};
  for (const key in input) {
    if (input[key]) {
      filterFormated[`${key}.${Object.keys(input[key])[0]}`] = Object.values(input[key])[0];
      continue;
    }
    filterFormated[key] = input[key];
  }
  return filterFormated;
};
