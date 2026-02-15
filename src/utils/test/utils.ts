/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/tests/util.md
 */
import { SpanStatus } from '@opentelemetry/api';

import { ApiTrancingInput, TracingType, UserRequest } from '@/utils/request';

import { BaseException } from '@/utils/exception';
import { ZodExceptionIssue } from '@/utils/validator';
import { faker } from '@faker-js/faker';
import { z } from 'zod';
import { AnyFunction } from '../types';

export class TestUtils {
  static faker: typeof faker = faker;

  static mock(): jest.Mock {
    return jest.fn();
  }

  static mockResolvedValue<T = void>(mock?: Partial<NoInfer<Partial<T>>> | null): jest.Mock<Promise<NoInfer<T>>> {
    return jest.fn().mockResolvedValue(mock as NoInfer<Partial<T>>);
  }

  static mockResolvedValueOnce<T = void>(mock?: Partial<NoInfer<Partial<T>>> | null): jest.Mock<Promise<NoInfer<T>>> {
    return jest.fn().mockResolvedValueOnce(mock as NoInfer<Partial<T>>);
  }

  static mockRejectedValue(mock: BaseException): jest.Mock {
    return jest.fn().mockRejectedValue(mock);
  }

  static mockRejectedValueOnce(mock: BaseException): jest.Mock {
    return jest.fn().mockRejectedValueOnce(mock);
  }

  static mockReturnValue<T = void>(mock?: Partial<NoInfer<T>> | null): jest.Mock<NoInfer<T>> {
    return jest.fn().mockReturnValue(mock as NoInfer<T> | null);
  }

  static mockImplementation<T = void>(mock?: (...args: unknown[]) => Partial<NoInfer<T>> | null): jest.Mock<any> {
    return jest.fn().mockImplementation(mock);
  }

  static expectZodError = async (callback: AnyFunction, expected: AnyFunction) => {
    try {
      await callback();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issues = error.issues.map(({ message, path }: ZodExceptionIssue) => ({ message, path: path[0] }));
        expected(issues);
      }
    }
  };

  static nameOf<T>(name: keyof T) {
    return name;
  }

  static mockUUID = () => faker.string.uuid();

  static mockObjectId = () => faker.string.hexadecimal({ length: 24, casing: 'lower', prefix: '' });

  static mockDate = () => faker.date.past();

  static mockISODate = () => faker.date.past().toISOString();

  static mockText = (length: number = 10) => faker.lorem.words(length);

  static mockNumber = (min: number = 0, max: number = 100) => faker.number.int({ min, max });

  static mockBoolean = () => faker.datatype.boolean();

  static mockArray<T>(item: T, length: number = 3): T[] {
    return Array.from({ length }, () => item);
  }

  static getMockTracing = (): ApiTrancingInput => {
    return {
      tracing: {
        logEvent(key: string, value: unknown) {
          return key + value;
        },
        setStatus(event: SpanStatus) {
          return event;
        },
        addAttribute(key, value) {
          return key + value;
        },
        finish() {
          return true;
        },
      } as Partial<TracingType> as TracingType,
      user: this.mockUser()
    };
  };

  static mockUser = (): UserRequest => {
    return { email: 'test', name: 'test', id: this.mockUUID() } as UserRequest;
  };
}
