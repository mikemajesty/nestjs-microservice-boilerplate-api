import { z } from 'zod';

import { PaginationSchema } from '@/utils/pagination';
import { SearchSchema } from '@/utils/search';
import { SortSchema } from '@/utils/sort';

import { ApiBadRequestException } from './../../exception';

export const ListSchema = z.intersection(PaginationSchema, SortSchema.merge(SearchSchema));

export function ValidateDatabaseSortAllowed(allowedSortList: string[] = []) {
  return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: z.infer<typeof ListSchema>[]) {
      const input = args[0];

      const sort = {};

      Object.keys(input.sort || {}).forEach((key) => {
        const allowed = allowedSortList.includes(key);
        if (!allowed) throw new ApiBadRequestException({ message: `allowed sorts are: ${allowedSortList.join(', ')}` });
      });

      for (const allowedFilter of allowedSortList) {
        if (!input.sort) continue;
        const filter = input.sort[allowedFilter];
        if (filter) {
          sort[allowedFilter] = filter;
        }
      }

      args[0].sort = sort;
      const result = originalMethod.apply(this, args);
      return result;
    };
  };
}
