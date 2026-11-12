/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/decorators/normalize-typeorm-filter.md
 */
import { IsNull } from 'typeorm'

type TypeOrmFilter = Record<string, unknown>

export function NormalizeTypeOrmFilter(filterIndex = 0) {
  return (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value

    descriptor.value = function (...args: unknown[]) {
      const filter = args[filterIndex]

      if (Array.isArray(filter)) {
        args[filterIndex] = filter.map(normalizeFilter)
      } else if (filter && typeof filter === 'object') {
        args[filterIndex] = normalizeFilter(filter as TypeOrmFilter)
      }

      return originalMethod.apply(this, args)
    }
  }
}

const normalizeFilter = (filter: TypeOrmFilter): TypeOrmFilter => ({
  ...filter,
  deletedAt: IsNull()
})
