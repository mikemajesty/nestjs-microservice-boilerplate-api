/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/tests/util.md
 */

import { ApiBadRequestException, BaseException } from '@/utils/exception'
import { ZodException, ZodExceptionIssue } from '@/utils/validator'
import { Provider } from '@nestjs/common'
import { AnyFunction } from '../types'

const isZodExceptionIssue = (value: unknown): value is ZodExceptionIssue => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof value.message === 'string' &&
    'path' in value &&
    Array.isArray(value.path)
  )
}

const isZodExceptionIssues = (value: unknown): value is ZodExceptionIssue[] => {
  return Array.isArray(value) && value.length > 0 && value.every(isZodExceptionIssue)
}

const getZodIssues = (error: unknown): ZodExceptionIssue[] | undefined => {
  if (error instanceof ZodException) return error.issues
  if (!(error instanceof ApiBadRequestException)) return undefined

  const details = error.parameters?.details
  return isZodExceptionIssues(details) ? details : undefined
}

export class TestUtils {
  static mock<T = void>(): jest.Mock<NoInfer<T>> {
    return jest.fn()
  }

  static mockProvider<T>(
    provide: abstract new (...args: never[]) => T,
    mock: jest.Mocked<Partial<T>> = {} as jest.Mocked<Partial<T>>
  ): Provider {
    return {
      provide,
      useValue: mock as jest.Mocked<Partial<T>> as T
    }
  }

  static mockResolvedValue<T = void>(mock?: Partial<NoInfer<Partial<T>>> | null): jest.Mock<Promise<NoInfer<T>>> {
    return jest.fn().mockResolvedValue(mock as NoInfer<Partial<T>>)
  }

  static mockResolvedValueOnce<T = void>(mock?: Partial<NoInfer<Partial<T>>> | null): jest.Mock<Promise<NoInfer<T>>> {
    return jest.fn().mockResolvedValueOnce(mock as NoInfer<Partial<T>>)
  }

  static mockRejectedValue<T = never>(mock: BaseException | Error): jest.Mock<Promise<NoInfer<T>>> {
    return jest.fn().mockRejectedValue(mock)
  }

  static mockRejectedValueOnce<T = never>(mock: BaseException | Error): jest.Mock<Promise<NoInfer<T>>> {
    return jest.fn().mockRejectedValueOnce(mock)
  }

  static mockReturnValue<T = void>(mock?: Partial<NoInfer<Partial<T>>> | null): jest.Mock<NoInfer<T>> {
    return jest.fn().mockReturnValue(mock as NoInfer<Partial<T>> | null)
  }

  static mockImplementation<T = void>(mock?: (...args: unknown[]) => Partial<NoInfer<T>> | null): jest.Mock<any> {
    return jest.fn().mockImplementation(mock)
  }

  static spyOn<T extends object, K extends keyof T>(object: T, method: K): jest.SpyInstance {
    return jest.spyOn(object, method as never)
  }

  static clearMocks(): void {
    jest.clearAllMocks()
  }

  static restoreMocks(): void {
    jest.restoreAllMocks()
  }

  static expectZodError = async (callback: AnyFunction, expected: AnyFunction) => {
    try {
      await callback()
    } catch (error) {
      const zodIssues = getZodIssues(error)
      if (!zodIssues) throw error

      expected(zodIssues.map(({ message, path }) => ({ message, path: path[0] })))
      return
    }

    throw new Error('Expected callback to throw a ZodException')
  }

  static nameOf<T>(name: keyof T) {
    return name
  }
}
