import { Types } from 'mongoose';
import { z } from 'zod';

import { ApiTrancingInput, TracingType, UserRequest } from '@/utils/request';

export class TestUtils {
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

  static getMockUUID = () => '9269248e-54cc-46f9-80c0-7029c989c0e3';

  static getMockObjectId = () => new Types.ObjectId('671d15ddd0bcb68467b767d0');

  static getMockDate = () => new Date('Sat Feb 10 2024 14:00:35');

  static getMockTracing = (): ApiTrancingInput => {
    return {
      tracing: {
        logEvent(key, value) {
          return key + value;
        },
        setStatus(event) {
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
