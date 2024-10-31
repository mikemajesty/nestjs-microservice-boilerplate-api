import { RootFilterQuery } from 'mongoose';

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

      const where: RootFilterQuery<IEntity> = {
        $or: [],
        deletedAt: null
      };

      if (input?.search?.id) {
        where['_id'] = (input.search.id as string).trim();
        delete input.search.id;
      }

      const filterNameList = allowedFilterList.map((f) => f.name as string);

      Object.keys(input.search || {}).forEach((key) => {
        const allowed = filterNameList.includes(key);
        if (!allowed) throw new ApiBadRequestException(`allowed filters are: ${filterNameList.join(', ')} `);
      });

      for (const allowedFilter of allowedFilterList) {
        if (!input?.search) continue;
        const filter = input.search[allowedFilter.name as string];

        if (!filter) continue;

        const regexFilter = MongoUtils.createMongoRegexText(filter);

        if (allowedFilter.type === SearchTypeEnum.equal) {
          if (typeof regexFilter === 'object') {
            where.$or.push(
              ...(filter as string[]).map((filter) => {
                return {
                  [`${allowedFilter.map ?? (allowedFilter.name as string)} `]: convertFilterValue({
                    value: filter,
                    format: allowedFilter.format
                  })
                };
              })
            );
          }
          if (typeof regexFilter === 'string') {
            where.$or.push({
              [`${allowedFilter.map ?? (allowedFilter.name as string)} `]: convertFilterValue({
                value: filter,
                format: allowedFilter.format
              })
            });
          }
        }

        if (allowedFilter.type === SearchTypeEnum.like) {
          if (typeof regexFilter === 'object') {
            where.$or.push(
              ...regexFilter.map((filter) => {
                return {
                  [`${allowedFilter.map ?? (allowedFilter.name as string)} `]: {
                    $regex: filter,
                    $options: 'i'
                  }
                };
              })
            );
          }

          if (typeof regexFilter === 'string') {
            where.$or.push({
              [`${allowedFilter.map ?? (allowedFilter.name as string)} `]: {
                $regex: MongoUtils.createMongoRegexText(filter),
                $options: 'i'
              }
            });
          }
        }
      }

      if (!where.$or.length) {
        delete where.$or;
      }

      args[0].search = where;
      const result = originalMethod.apply(this, args);
      return result;
    };
  };
}
