import { Op } from 'sequelize';
import { z } from 'zod';

import { AllowedFilter, SearchTypeEnum } from '@/utils/decorators/types';
import { ApiBadRequestException } from '@/utils/exception';
import { PaginationSchema } from '@/utils/pagination';
import { SearchSchema } from '@/utils/search';
import { SortSchema } from '@/utils/sort';

const SequelizeSort = {
  '1': 'ASC',
  '-1': 'DESC'
};

export const ListSchema = z.intersection(PaginationSchema, SortSchema.merge(SearchSchema));

export function ConvertPaginateInputToSequelizeFilter<T extends object>(allowedFilterList: AllowedFilter<T>[]) {
  return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: z.infer<typeof ListSchema>[]) {
      const input = args[0];

      const postgresSort = [];

      const where = {
        deletedAt: null
      };

      const filterNameList = allowedFilterList.map((f) => f.name as string);

      Object.keys(input.search || {}).forEach((key) => {
        const allowed = filterNameList.includes(key);
        if (!allowed) throw new ApiBadRequestException(`allowed filters are: ${filterNameList.join(', ')}`);
      });

      for (const allowedFilter of allowedFilterList) {
        if (!input.search) continue;
        const filter = input.search[allowedFilter.name as string];

        if (!filter) continue;

        if (allowedFilter.type === SearchTypeEnum.equal) {
          where[allowedFilter.name as string] = filter;
        }

        if (allowedFilter.type === SearchTypeEnum.like) {
          where[allowedFilter.name as string] = { [Op.iLike]: `%${filter}%` };
        }
      }

      for (const key in input?.sort) {
        const sort = input.sort[`${key}`];
        postgresSort.push([key, SequelizeSort[`${sort}`]]);
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
