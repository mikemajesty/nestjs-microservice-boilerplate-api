import { Raw } from 'typeorm';

import { DateUtils } from '@/utils/date';
import { ApiBadRequestException } from '@/utils/exception';

import { AllowedFilter, SearchTypeEnum } from '../../types';

const convertFilterValue = (input: Pick<AllowedFilter<unknown>, 'format'> & { value: unknown }) => {
  if (input.format === 'String') {
    return `${input.value}`;
  }

  if (input.format === 'Date') {
    return DateUtils.createJSDate(`${input.value}`, false);
  }

  if (input.format === 'DateIso') {
    return DateUtils.createISODate(`${input.value}`, false);
  }

  if (input.format === 'Boolean') {
    if (input.value === 'true') {
      return true;
    }

    if (input.value === 'false') {
      return false;
    }
    throw new ApiBadRequestException('invalid boolean');
  }

  if (input.format === 'Number') {
    return Number(input.value);
  }

  return input.value;
};

export function ConvertTypeOrmFilter<T>(allowedFilterList: AllowedFilter<T>[] = []) {
  return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: { search: { [key: string]: string | string[] } }[]) {
      const input = args[0];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let where: any | [] = {};

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
            const orEqual = filter.map((f) => {
              return {
                [`${allowedFilter?.map ?? allowedFilter.name.toString()}`]: convertFilterValue({
                  value: f,
                  format: allowedFilter.format
                })
              };
            });

            where = orEqual;
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
