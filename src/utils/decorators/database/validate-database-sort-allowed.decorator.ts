import { ApiBadRequestException } from '@/utils/exception';
import { PaginationSchema } from '@/utils/pagination';
import { SearchSchema } from '@/utils/search';
import { SortEnum, SortSchema } from '@/utils/sort';
import { Infer, InputValidator } from '@/utils/validator';

export const ListSchema = InputValidator.intersection(PaginationSchema, SortSchema.merge(SearchSchema));

type AllowedSort<T> = { name: keyof T; map?: string };

export function ValidateDatabaseSortAllowed<T>(...allowedSortList: AllowedSort<T>[]) {
  return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: Infer<typeof ListSchema>[]) {
      const input = args[0];

      const sort: { [key: string]: SortEnum } = {};

      const sortList = (allowedSortList || []) as AllowedSort<T>[];

      Object.keys(input.sort || {}).forEach((key) => {
        const allowed = sortList.find((s) => s.name === key);

        if (!allowed) throw new ApiBadRequestException(`sort ${key} not allowed, allowed list: ${sortList.join(', ')}`);
      });

      for (const allowedFilter of sortList) {
        if (!input.sort) continue;
        const filter = input.sort[`${allowedFilter.name.toString()}`];
        if (filter) {
          sort[`${allowedFilter?.map ?? allowedFilter.name.toString()}`] = filter;
        }
      }

      args[0].sort = sort;
      const result = originalMethod.apply(this, args);
      return result;
    };
  };
}
