import { In, Raw } from 'typeorm';

import { ApiBadRequestException } from '@/utils/exception';

import { AllowedFilter, SearchTypeEnum } from '../../types';
import { convertFilterValue } from '../utils';

export function ConvertTypeOrmFilter<T>(allowedFilterList: AllowedFilter<T>[] = []) {
  return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: { search: { [key: string]: string | string[] } }[]) {
      const input = args[0];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {};

      const filterNameList = allowedFilterList.map((f) => f.name as string);

      Object.keys(input.search || {}).forEach((key) => {
        const allowed = filterNameList.includes(key);
        if (!allowed) throw new ApiBadRequestException(`allowed filters are: ${filterNameList.join(', ')}`);
      });

      for (const allowedFilter of allowedFilterList) {
        if (!input.search) continue;

        const filter = input.search[allowedFilter.name.toString()];

        if (!filter) continue;

        if (allowedFilter.type === SearchTypeEnum.equal) {
          if (typeof filter === 'object') {
            const filterList = filter.map((f) => {
              return convertFilterValue({
                value: f,
                format: allowedFilter.format
              });
            });

            where[`${allowedFilter?.map ?? allowedFilter.name.toString()}`] = In<unknown>(filterList);
          }

          if (typeof filter === 'string') {
            where[`${allowedFilter?.map ?? allowedFilter.name.toString()}`] = convertFilterValue({
              value: filter,
              format: allowedFilter.format
            });
          }
        }

        if (allowedFilter.type === SearchTypeEnum.like) {
          if (typeof filter === 'object') {
            const valueFilter: { [key: string]: unknown } = {};

            for (const f of filter) {
              valueFilter[`${f}`] = f;
            }

            const createManyLike = (alias: string) => {
              return filter
                .map((value) => {
                  return `unaccent(${alias}) ilike unaccent(:${value})`;
                })
                .join(' or ');
            };

            where[`${allowedFilter?.map ?? allowedFilter.name.toString()}`] = Raw(
              (alias) => createManyLike(alias),
              valueFilter
            );
          }

          if (typeof filter === 'string') {
            where[`${allowedFilter?.map ?? allowedFilter.name.toString()}`] = Raw(
              (alias) => `unaccent(${alias}) ilike unaccent(:value)`,
              {
                value: filter
              }
            );
          }
        }
      }
      args[0].search = where;
      const result = originalMethod.apply(this, args);
      return result;
    };
  };
}
