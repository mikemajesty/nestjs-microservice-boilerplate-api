import { Types } from 'mongoose';

import { DateUtils } from '@/utils/date';
import { ApiBadRequestException } from '@/utils/exception';
import { MongoUtils } from '@/utils/mongoose';

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

  if (input.format === 'ObjectId') {
    const isObjectId = MongoUtils.isObjectId(`${input.value}`);

    if (!isObjectId) {
      throw new ApiBadRequestException('invalid objectId');
    }
    return new Types.ObjectId(`${input.value} `);
  }

  return input.value;
};

export function ConvertMongooseFilter<T>(allowedFilterList: AllowedFilter<T>[] = []) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: { search: { [key: string]: string | string[] } }[]) {
      const input = args[0];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {};

      where['deletedAt'] = null;
      where['$or'] = [];

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
            (where['$or'] as unknown[]).push(
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
            (where['$or'] as unknown[]).push({
              [`${allowedFilter.map ?? (allowedFilter.name as string)} `]: convertFilterValue({
                value: filter,
                format: allowedFilter.format
              })
            });
          }
        }

        if (allowedFilter.type === SearchTypeEnum.like) {
          if (typeof regexFilter === 'object') {
            (where['$or'] as unknown[]).push(
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
            (where['$or'] as unknown[]).push({
              [`${allowedFilter.map ?? (allowedFilter.name as string)} `]: {
                $regex: MongoUtils.createMongoRegexText(filter),
                $options: 'i'
              }
            });
          }
        }
      }

      if (!where['$or'].length) {
        delete where['$or'];
      }

      args[0].search = where;
      const result = originalMethod.apply(this, args);
      return result;
    };
  };
}
