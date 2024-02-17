import { ILike } from 'typeorm';

import { ApiBadRequestException } from '@/utils/exception';

import { AllowedFilter, SearchTypeEnum } from '../../types';

export function ValidatePostgresFilter<T>(allowedFilterList: AllowedFilter<T>[] = []) {
  return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: { search: { [key: string]: string } }[]) {
      const input = args[0];

      const where = {};

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
          where[allowedFilter.name.toString()] = filter;
        }

        if (allowedFilter.type === SearchTypeEnum.like) {
          where[allowedFilter.name.toString()] = ILike(`%${filter}%`);
        }
      }

      args[0].search = where;
      const result = originalMethod.apply(this, args);
      return result;
    };
  };
}
