/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/tests/util.md
 */

import { BaseException } from '@/utils/exception'
import { ZodExceptionIssue } from '@/utils/validator'
import { Provider } from '@nestjs/common'
import { z } from 'zod'
import { AnyFunction } from '../types'

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
      if (error instanceof z.ZodError) {
        const issues = error.issues.map(({ message, path }: ZodExceptionIssue) => ({ message, path: path[0] }))
        expected(issues)
      }
    }
  }

  static nameOf<T>(name: keyof T) {
    return name
  }
}
