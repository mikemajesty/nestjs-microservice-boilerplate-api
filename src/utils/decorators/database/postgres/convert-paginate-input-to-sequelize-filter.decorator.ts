import { Op } from 'sequelize';
import { z } from 'zod';

import { SearchTypeEnum } from '@/utils/decorators/types';
import { ApiBadRequestException } from '@/utils/exception';
import { PaginationSchema } from '@/utils/pagination';
import { SearchSchema } from '@/utils/search';
import { SortSchema } from '@/utils/sort';

import { AllowedFilter } from '../../types';

const SequelizeSort = {
  '1': 'ASC',
  '-1': 'DESC'
};

export const ListSchema = z.intersection(PaginationSchema, SortSchema.merge(SearchSchema));

export function ConvertPaginateInputToSequelizeFilter(allowedFilterList: AllowedFilter[] = []) {
  return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: z.infer<typeof ListSchema>[]) {
      const input = args[0];

      const postgresSort = [];

      const where = {
        deletedAt: null
      };

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
          where[allowedFilter.name] = { [Op.iLike]: `%${filter}%` };
        }
      }

      for (const key in input?.sort) {
        const sort = input.sort[key];
        postgresSort.push([key, SequelizeSort[sort]]);
      }

      const limit = Number(input.limit);

      const offset = Number(input.page - 1) * limit;

      const filter = {
        offset,
        limit,
        order: postgresSort,
        where,
        page: input.page
      };

      args[0] = filter;

      const result = originalMethod.apply(this, args);
      return result;
    };
  };
}
