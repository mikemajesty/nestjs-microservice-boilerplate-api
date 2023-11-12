import { z } from 'zod';

import { PaginationSchema } from '@/utils/pagination';
import { SearchSchema } from '@/utils/search';
import { SortSchema } from '@/utils/sort';

import { ApiBadRequestException } from './../../exception';

export const ListSchema = z.intersection(PaginationSchema, SortSchema.merge(SearchSchema));

type AllowedSort<T> = keyof T;

export function ValidateDatabaseSortAllowed<T>(...allowedSortList: AllowedSort<T>[]) {
  return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: z.infer<typeof ListSchema>[]) {
      const input = args[0];

      const sort = {};

      const sortList = (allowedSortList || []) as unknown as string[];

      Object.keys(input.sort || {}).forEach((key) => {
        const allowed = sortList.includes(key);
        if (!allowed) throw new ApiBadRequestException(`allowed sorts are: ${sortList.join(', ')}`);
      });

      for (const allowedFilter of sortList) {
        if (!input.sort) continue;
        const filter = input.sort[`${allowedFilter}`];
        if (filter) {
          sort[`${allowedFilter}`] = filter;
        }
      }

      args[0].sort = sort;
      const result = originalMethod.apply(this, args);
      return result;
    };
  };
}
