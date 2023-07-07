import { ApiBadRequestException } from '@/utils/exception';

import { skipParentheses } from '../../../database/mongoose';

export enum SearchTypeEnum {
  'like',
  'equal'
}

type AllowedFilter = {
  type: SearchTypeEnum;
  name: string;
};

export function ValidateMongooseFilter(allowedFilterList: AllowedFilter[] = []) {
  return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: { search: { [key: string]: string } }[]) {
      const input = args[0];

      const where = {};

      where['deletedAt'] = null;

      if (input?.search?.id) {
        where['_id'] = input.search.id.trim();
        delete input.search.id;
      }

      const filterNameList = allowedFilterList.map((f) => f.name);

      Object.keys(input.search || {}).forEach((key) => {
        const allowed = filterNameList.includes(key);
        if (!allowed)
          throw new ApiBadRequestException({ message: `allowed filters are: ${filterNameList.join(', ')}` });
      });

      for (const allowedFilter of allowedFilterList) {
        if (!input.search) continue;
        const filter = input.search[allowedFilter.name];

        if (!filter) continue;

        if (allowedFilter.type === SearchTypeEnum.equal) {
          where[allowedFilter.name] = filter;
        }

        if (allowedFilter.type === SearchTypeEnum.like) {
          where[allowedFilter.name] = new RegExp(skipParentheses(filter), 'gi');
        }
      }

      args[0].search = where;
      const result = originalMethod.apply(this, args);
      return result;
    };
  };
}
