import { ApiInternalServerException, BaseException } from '../exception'

/**
 * Adds the declaring class and method as context to rejected async operations.
 * Preserves existing contexts and BaseException identity, even when immutable.
 * Other values that cannot receive a context are wrapped with the original cause.
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
        if ((typeof error === 'object' && error !== null) || typeof error === 'function') {
          if ('context' in error && error.context != null) {
            throw error
          }

          const descriptor = Object.getOwnPropertyDescriptor(error, 'context')
          const added = Reflect.defineProperty(
            error,
            'context',
            descriptor
              ? { value: context }
              : { value: context, enumerable: error instanceof BaseException, configurable: true, writable: true }
          )

          if (added || error instanceof BaseException) throw error
        }

        const message =
          error !== null &&
          (typeof error === 'object' || typeof error === 'function') &&
          'message' in error &&
          typeof error.message === 'string'
            ? error.message
            : String(error)

        throw new ApiInternalServerException(message, { context, cause: error })
      }
    }

    return descriptor
  }
}
