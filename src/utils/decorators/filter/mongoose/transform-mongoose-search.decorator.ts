/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/decorators/validate-mongoose-filter.md
 */
import { IEntity } from '@/utils/entity'
import { ApiBadRequestException } from '@/utils/exception'
import { FilterQuery, MongoUtils } from '@/utils/mongoose'

import { AllowedFilter, SearchTypeEnum } from '../../types'
import { convertFilterValue } from '../filter-utils'

export function TransformMongooseSearch<T>(allowedFilterList: AllowedFilter<T>[] = []) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    descriptor.value = function (...args: { search: { [key: string]: string | number | (string | number)[] } }[]) {
      const input = args[0]

      const where: FilterQuery<IEntity> = {
        $and: [],
        deletedAt: null
      }

      if (input?.search?.id) {
        where._id = (input.search.id as string).trim()
        delete input.search.id
      }

      const filterNameList = allowedFilterList.map((f) => f.name as string)

      Object.keys(input.search || {}).forEach((key) => {
        const allowed = filterNameList.includes(key)
        if (!allowed)
          throw new ApiBadRequestException(`filter ${key} not allowed, allowed list: ${filterNameList.join(', ')}`)
      })

      const IS_ARRAY_FILTER = 'object'
      const IS_SINGLE_FILTER = 'string'

      for (const allowedFilter of allowedFilterList) {
        if (!input?.search) continue
        const filters = input.search[allowedFilter.name as string]

        if (!filters && filters !== 0) continue

        const field = `${allowedFilter.map ?? allowedFilter.name.toString()}`

        if (allowedFilter.type === SearchTypeEnum.equal) {
          if (Array.isArray(filters)) {
            where?.$and?.push({
              [field]: {
                $in: filters.map((filter) =>
                  convertFilterValue({
                    value: filter,
                    format: allowedFilter.format
                  })
                )
              }
            })
          }

          if (typeof filters === IS_SINGLE_FILTER || typeof filters === 'number') {
            where?.$and?.push({
              [field]: convertFilterValue({
                value: filters,
                format: allowedFilter.format
              })
            })
          }
        }

        if (allowedFilter.type === SearchTypeEnum.like) {
          const regexFilter = MongoUtils.createRegexFilterText(filters as string | string[])
          if (typeof regexFilter === IS_ARRAY_FILTER) {
            const alternatives = (regexFilter as string[]).map((filter: string) => {
                return {
                  [field]: {
                    $regex: filter,
                    $options: 'i'
                  }
                }
              })
            if (alternatives.length) {
              where?.$and?.push({ $or: alternatives })
            }
          }

          if (typeof regexFilter === IS_SINGLE_FILTER) {
            where?.$and?.push({
              [field]: {
                $regex: regexFilter,
                $options: 'i'
              }
            })
          }
        }
      }

      if (!where?.$and?.length) {
        delete where.$and
      }

      args[0].search = where
      const result = originalMethod.apply(this, args)
      return result
    }
  }
}
