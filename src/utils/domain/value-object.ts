/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/utils/value-object.md
 */
import { isDeepStrictEqual } from 'node:util'

import { ApiUnprocessableEntityException } from '../exception'
import { BaseZodType } from '../schema'

export const BaseValueObject = <T>(schema: BaseZodType) => {
  abstract class ValueObject {
    protected constructor(value: T) {
      if (!schema) {
        throw new ApiUnprocessableEntityException(`${this.constructor.name} required a schema`)
      }

      const parsed = schema.parse(value) as T

      Object.assign(this, parsed)
    }

    toData(): T {
      return schema.parse(this) as T
    }

    equals(other: unknown): boolean {
      if (!other || other.constructor !== this.constructor) {
        return false
      }

      return isDeepStrictEqual(this.toData(), (other as ValueObject).toData())
    }

    freeze(): void {
      Object.freeze(this)
    }
  }

  return ValueObject
}
