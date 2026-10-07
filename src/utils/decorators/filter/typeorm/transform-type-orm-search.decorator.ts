/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/decorators/convert-typeorm-filter.md
 */
import { FindOperator, In, Raw } from 'typeorm'

import { IEntity } from '@/utils/entity'
import { ApiBadRequestException } from '@/utils/exception'

import { AllowedFilter, SearchTypeEnum } from '../../types'
import { convertFilterValue } from '../filter-utils'

type TransformTypeOrmSearchInput = {
  [key: string]: FindOperator<IEntity> | string | string[] | unknown
}

export function TransformTypeOrmSearch<T>(allowedFilterList: AllowedFilter<T>[] = []) {
  return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value

    descriptor.value = function (...args: { search: TransformTypeOrmSearchInput }[]) {
      const input = args[0]

      const where: TransformTypeOrmSearchInput = {}

      const filterNameList = allowedFilterList.map((f) => f.name as string)

      Object.keys(input.search || {}).forEach((key) => {
        const allowed = filterNameList.includes(key)
        if (!allowed)
          throw new ApiBadRequestException(`filter ${key} not allowed, allowed list: ${filterNameList.join(', ')}`)
      })

      const IS_ARRAY_FILTER = 'object'
      const IS_SINGLE_FILTER = 'string'

      for (const [filterIndex, allowedFilter] of allowedFilterList.entries()) {
        if (!input.search) continue

        const filters = input.search[allowedFilter.name.toString()]

        if (!filters && filters !== 0) continue

        const field = `${allowedFilter?.map ?? allowedFilter.name.toString()}`

        if (allowedFilter.type === SearchTypeEnum.equal) {
          if (typeof filters === IS_ARRAY_FILTER) {
            const filterList = (filters as string[]).map((filter) => {
              return convertFilterValue({
                value: filter,
                format: allowedFilter.format
              })
            })

            where[`${field}`] = In<unknown>(filterList)
          }

          if (typeof filters === IS_SINGLE_FILTER || typeof filters === 'number') {
            where[`${field}`] = convertFilterValue({
              value: filters,
              format: allowedFilter.format
            })
          }
        }

        if (allowedFilter.type === SearchTypeEnum.like) {
          if (typeof filters === IS_ARRAY_FILTER) {
            const valueFilter: { [key: string]: unknown } = {}

            for (const [valueIndex, filter] of (filters as string[]).entries()) {
              valueFilter[`search_${filterIndex}_${valueIndex}`] = filter
            }

            const createManyLike = (alias: string) => {
              const condition = (filters as string[])
                .map((_, valueIndex) => {
                  return `unaccent(${alias}) ilike unaccent(:search_${filterIndex}_${valueIndex})`
                })
                .join(' or ')

              return condition ? `(${condition})` : condition
            }

            where[`${field}`] = Raw((alias: string) => createManyLike(alias), valueFilter)
          }

          if (typeof filters === IS_SINGLE_FILTER) {
            const parameterName = `search_${filterIndex}_0`
            where[`${field}`] = Raw((alias: string) => `unaccent(${alias}) ilike unaccent(:${parameterName})`, {
              [parameterName]: filters
            })
          }
        }
      }
      args[0].search = where
      const result = originalMethod.apply(this, args)
      return result
    }
  }
}
