import { AttributeValue, SpanStatus, TimeInput } from '@opentelemetry/api';
import { Types } from 'mongoose';
import { z } from 'zod';

import { ApiTrancingInput, TracingType, UserRequest } from '@/utils/request';

import { BaseException } from './exception';

export class TestUtils {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static mockImplementation<T = void>(mock?: (...args: unknown[]) => NoInfer<T>): jest.Mock<any> {
    return jest.fn().mockImplementation(mock);
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  static expectZodError = async (callback: Function, expected: Function) => {
    try {
      await callback();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issues = error.issues.map(({ message, path }: z.ZodIssue) => ({ message, path: path[0] }));
        expected(issues);
      }
    }
  };

  static nameOf<T>(name: keyof T) {
    return name;
  }

  static getMockUUID = () => '9269248e-54cc-46f9-80c0-7029c989c0e3';

  static getMockObjectId = () => new Types.ObjectId('671d15ddd0bcb68467b767d0');

  static getMockDate = () => new Date('Sat Feb 10 2024 14:00:35');

  static getMockTracing = (): ApiTrancingInput => {
    return {
      tracing: {
        logEvent(key: string, value: AttributeValue | TimeInput) {
          return key + value;
        },
        setStatus(event: SpanStatus) {
          return event;
        }
      } as Partial<TracingType> as TracingType,
      user: this.getMockUser()
    };
  };

  static getMockUser = (): UserRequest => {
    return { email: 'test', name: 'test', id: this.getMockUUID() } as UserRequest;
  };
}
