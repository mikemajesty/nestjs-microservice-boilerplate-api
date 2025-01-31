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

const convertObjectFilterToMongoFilter = (input: FilterQuery<IEntity>, recursiveInput: FilterQuery<IEntity> = {}) => {
  const filterFormated: FilterQuery<IEntity> = recursiveInput;

  for (const key in input) {
    if (input[`${key}`] && typeof input[`${key}`] === 'object') {
      for (const subKey of Object.keys(input[`${key}`])) {
        convertObjectFilterToMongoFilter({ [`${key}.${subKey}`]: input[`${key}`][`${subKey}`] }, filterFormated);
        continue;
      }
      continue;
    }
    filterFormated[`${key}`] = input[`${key}`];
  }

  return filterFormated;
};
