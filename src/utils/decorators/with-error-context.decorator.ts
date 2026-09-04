import { ApiInternalServerException, BaseException } from '../exception'

/**
 * Decorator that automatically adds error context based on the class and method name.
 *
 * @example
 * @WithErrorContext()
 * async method(): Promise<string> {
 *
 * }
 *
 * The context will automatically be 'className.methodName'
 */
export function WithErrorContext() {
  return function (target: object, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const className = target.constructor.name
    const methodName = String(propertyKey)
    const context = `${className}.${methodName}`

    descriptor.value = async function (...args: unknown[]) {
      try {
        return await originalMethod.apply(this, args)
      } catch (error) {
        if (error instanceof BaseException) {
          error.context = error.context ?? context
          throw error
        }
        if (typeof error === 'string') {
          throw new ApiInternalServerException(error, {
            context
          })
        }

        Object.defineProperty(error, 'context', {
          value: context,
          enumerable: false,
          configurable: true,
          writable: true
        })

        throw error
      }
    }

    return descriptor
  }
}
