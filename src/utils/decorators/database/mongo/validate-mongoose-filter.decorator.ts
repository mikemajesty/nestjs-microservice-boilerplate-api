import { FilterQuery } from 'mongoose';

import { IEntity } from '@/utils/entity';
import { ApiBadRequestException } from '@/utils/exception';
import { MongoUtils } from '@/utils/mongoose';

import { AllowedFilter, SearchTypeEnum } from '../../types';
import { convertFilterValue } from '../utils';

export function ConvertMongooseFilter<T>(allowedFilterList: AllowedFilter<T>[] = []) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: { search: { [key: string]: string | string[] } }[]) {
      const input = args[0];

      const where: FilterQuery<IEntity> = {
        $or: [],
        $and: [],
        deletedAt: null
      };

      if (input?.search?.id) {
        where._id = (input.search.id as string).trim();
        delete input.search.id;
      }

      const filterNameList = allowedFilterList.map((f) => f.name as string);

      Object.keys(input.search || {}).forEach((key) => {
        const allowed = filterNameList.includes(key);
        if (!allowed)
          throw new ApiBadRequestException(`filter ${key} not allowed, allowed list: ${filterNameList.join(', ')}`);
      });

      const IS_ARRAY_FILTER = 'object';
      const IS_SINGLE_FILTER = 'string';

      for (const allowedFilter of allowedFilterList) {
        if (!input?.search) continue;
        const filters = input.search[allowedFilter.name as string];

        if (!filters) continue;

        const regexFilter = MongoUtils.createRegexFilterText(filters);

        const field = `${allowedFilter.map ?? allowedFilter.name.toString()}`;

        if (allowedFilter.type === SearchTypeEnum.equal) {
          if (typeof regexFilter === IS_ARRAY_FILTER) {
            where?.$or?.push(
              ...(filters as string[]).map((filter) => {
                return {
                  [field]: convertFilterValue({
                    value: filter,
                    format: allowedFilter.format
                  })
                };
              })
            );
          }

          if (typeof regexFilter === IS_SINGLE_FILTER) {
            where?.$and?.push({
              [field]: convertFilterValue({
                value: filters,
                format: allowedFilter.format
              })
            });
          }
        }

        if (allowedFilter.type === SearchTypeEnum.like) {
          if (typeof regexFilter === IS_ARRAY_FILTER) {
            where?.$or?.push(
              ...(regexFilter as string[]).map((filter: string) => {
                return {
                  [field]: {
                    $regex: filter,
                    $options: 'i'
                  }
                };
              })
            );
          }

          if (typeof regexFilter === IS_SINGLE_FILTER) {
            where?.$and?.push({
              [field]: {
                $regex: MongoUtils.createRegexFilterText(filters),
                $options: 'i'
              }
            });
          }
        }
      }

      if (!where?.$or?.length) {
        delete where.$or;
      }

      if (!where?.$and?.length) {
        delete where.$and;
      }

      args[0].search = where;
      const result = originalMethod.apply(this, args);
      return result;
    };
  };
}
