import { IEntity } from '@/utils/entity';
import { FilterQuery } from '@/utils/mongoose';

export function ConvertMongoFilterToBaseRepository() {
  return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: unknown[]) {
      const input = args[0] as FilterQuery<IEntity> | undefined;

      if (!input) {
        return originalMethod.apply(this, args);
      }

      input.deletedAt = null;

      if (input.id) {
        input._id = input.id;
        delete input.id;
      }

      args[0] = convertFilterToMongo(input);

      return originalMethod.apply(this, args);
    };
  };
}

const convertFilterToMongo = (input: FilterQuery<IEntity>): Record<string, unknown> => {
  const flat: Record<string, unknown> = {};
  flattenKeys(input, flat);
  return flat;
};

const flattenKeys = (input: Record<string, unknown>, target: Record<string, unknown>, prefix = '') => {
  for (const key in input) {
    const value = input[`${key}`];
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenKeys(value as Record<string, unknown>, target, fullKey);
      continue;
    }

    target[`${fullKey}`] = value;
  }
};
