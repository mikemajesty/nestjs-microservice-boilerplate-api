import { Op } from 'sequelize';

import { SearchTypeEnum } from '@/utils/decorators/types';

import { AllowedFilter } from './types';

const SequelizeSort = {
  '1': 'ASC',
  '-1': 'DESC'
};

export function ConvertPaginateInputToSequelizeFilter(allowedFilterList: AllowedFilter[] = []) {
  return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const input = args[0];

      const postgresSort = [];

      const where = {};

      for (const allowedFilter of allowedFilterList) {
        if (!input.search) continue;
        const filter = input.search[allowedFilter.name];

        if (!filter) continue;

        if (allowedFilter.type === SearchTypeEnum.equal) {
          where[allowedFilter.name] = filter;
        }

        if (allowedFilter.type === SearchTypeEnum.like) {
          where[allowedFilter.name] = { [Op.iLike]: `%${filter}%` };
        }
      }

      for (const key in input?.sort) {
        const sort = input.sort[key];
        postgresSort.push([key, SequelizeSort[sort]]);
      }

      const filter = {
        offset: input.page,
        limit: input.limit,
        order: postgresSort,
        where
      };

      args[0] = filter;

      const result = originalMethod.apply(this, args);
      return result;
    };
  };
}
