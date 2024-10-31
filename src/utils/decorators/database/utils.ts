import { Types } from 'mongoose';

import { DateUtils } from '@/utils/date';
import { ApiBadRequestException } from '@/utils/exception';
import { MongoUtils } from '@/utils/mongoose';

import { AllowedFilter } from '../types';

export const convertFilterValue = (input: Pick<AllowedFilter<unknown>, 'format'> & { value: unknown }) => {
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
    const notNumber = Number.isNaN(input.value);
    if (notNumber) {
      throw new ApiBadRequestException('invalid number filter');
    }
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
