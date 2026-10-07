import { Types } from 'mongoose'

import { ApiBadRequestException } from '@/utils/exception'
import { MongoUtils } from '@/utils/mongoose'

import { AllowedFilter } from '../types'

export const convertFilterValue = (input: Pick<AllowedFilter<unknown>, 'format'> & { value: unknown }) => {
  if (input.format === 'String') {
    return `${input.value}`
  }

  if (input.format === 'Date' || input.format === 'DateIso') {
    if (!(input.value instanceof Date) && (typeof input.value !== 'string' || !input.value.trim())) {
      throw new ApiBadRequestException('invalid date filter')
    }

    const date = new Date(input.value instanceof Date ? input.value.getTime() : input.value)
    if (!Number.isFinite(date.getTime())) {
      throw new ApiBadRequestException('invalid date filter')
    }

    return input.format === 'DateIso' ? date.toISOString() : date
  }

  if (input.format === 'Boolean') {
    if (input.value === 'true') {
      return true
    }

    if (input.value === 'false') {
      return false
    }
    throw new ApiBadRequestException('invalid boolean filter')
  }

  if (input.format === 'Number') {
    if (
      (typeof input.value !== 'number' && typeof input.value !== 'string') ||
      (typeof input.value === 'string' && !input.value.trim())
    ) {
      throw new ApiBadRequestException('invalid number filter')
    }

    const number = Number(input.value)
    if (!Number.isFinite(number)) {
      throw new ApiBadRequestException('invalid number filter')
    }
    return number
  }

  if (input.format === 'ObjectId') {
    const isObjectId = MongoUtils.isObjectId(`${input.value}`)

    if (!isObjectId) {
      throw new ApiBadRequestException('invalid objectId filter')
    }
    return new Types.ObjectId(`${input.value}`)
  }

  return input.value
}
