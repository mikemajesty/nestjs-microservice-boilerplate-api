/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/decorators/with-error-context.md
 */
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
export function WithErrorContext(input?: WithErrorContextInput) {
  return function (target: object, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const className = target.constructor.name
    const methodName = String(propertyKey)
    const context = `${className}.${methodName}`

    descriptor.value = async function (...args: unknown[]) {
      try {
        return await originalMethod.apply(this, args)
      } catch (error) {
        const existingContext = getErrorContext(error)
        const mappedError = input?.map ? input.map(error) : error
        const mappedContext = getErrorContext(mappedError)

        if (mappedContext != null) {
          throw mappedError
        }

        const contextToApply = existingContext ?? context
        const added = addErrorContext(mappedError, contextToApply)

        if (added) {
          throw mappedError
        }

        throw new ApiInternalServerException(getErrorMessage(mappedError), {
          context: contextToApply,
          cause: error
        })
      }
    }

    return descriptor
  }
}

function getErrorContext(error: unknown): string | undefined {
  if (((typeof error === 'object' && error !== null) || typeof error === 'function') && 'context' in error) {
    return typeof error.context === 'string' ? error.context : undefined
  }

  return undefined
}

function addErrorContext(error: unknown, context: string): boolean {
  if ((typeof error !== 'object' || error === null) && typeof error !== 'function') {
    return false
  }

  const descriptor = Object.getOwnPropertyDescriptor(error, 'context')
  const added = Reflect.defineProperty(
    error,
    'context',
    descriptor
      ? { value: context }
      : { value: context, enumerable: error instanceof BaseException, configurable: true, writable: true }
  )

  return added || error instanceof BaseException
}

function getErrorMessage(error: unknown): string {
  if (
    error !== null &&
    (typeof error === 'object' || typeof error === 'function') &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message
  }

  return String(error)
}

export type WithErrorContextInput = {
  map: (error: unknown) => unknown
}
