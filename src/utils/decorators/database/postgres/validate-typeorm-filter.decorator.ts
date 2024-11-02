import { FindOperator, In, Raw } from 'typeorm';

import { IEntity } from '@/utils/entity';
import { ApiBadRequestException } from '@/utils/exception';

import { AllowedFilter, SearchTypeEnum } from '../../types';
import { convertFilterValue } from '../utils';

type ConvertTypeOrmFilterInput = {
  [key: string]: FindOperator<IEntity> | string | string[] | unknown;
};

export function ConvertTypeOrmFilter<T>(allowedFilterList: AllowedFilter<T>[] = []) {
  return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: { search: ConvertTypeOrmFilterInput }[]) {
      const input = args[0];

      const where: ConvertTypeOrmFilterInput = {};

      const filterNameList = allowedFilterList.map((f) => f.name as string);

      Object.keys(input.search || {}).forEach((key) => {
        const allowed = filterNameList.includes(key);
        if (!allowed)
          throw new ApiBadRequestException(`filter ${key} not allowed, allowed list: ${filterNameList.join(', ')}`);
      });

      for (const allowedFilter of allowedFilterList) {
        if (!input.search) continue;

        const filters = input.search[allowedFilter.name.toString()];

        if (!filters) continue;

        const field = `${allowedFilter?.map ?? allowedFilter.name.toString()}`;

        if (allowedFilter.type === SearchTypeEnum.equal) {
          if (typeof filters === 'object') {
            const filterList = (filters as string[]).map((filter) => {
              return convertFilterValue({
                value: filter,
                format: allowedFilter.format
              });
            });

            where[`${field}`] = In<unknown>(filterList);
          }

          if (typeof filters === 'string') {
            where[`${field}`] = convertFilterValue({
              value: filters,
              format: allowedFilter.format
            });
          }
        }

        if (allowedFilter.type === SearchTypeEnum.like) {
          if (typeof filters === 'object') {
            const valueFilter: { [key: string]: unknown } = {};

            for (const filter of filters as string[]) {
              valueFilter[`${filter}`] = filter;
            }

            const createManyLike = (alias: string) => {
              return (filters as string[])
                .map((value) => {
                  return `unaccent(${alias}) ilike unaccent(:${value})`;
                })
                .join(' or ');
            };

            where[`${field}`] = Raw((alias: string) => createManyLike(alias), valueFilter);
          }

          if (typeof filters === 'string') {
            where[`${field}`] = Raw((alias: string) => `unaccent(${alias}) ilike unaccent(:value)`, {
              value: filters
            });
          }
        }
      }
      args[0].search = where;
      const result = originalMethod.apply(this, args);
      return result;
    };
  };
}
