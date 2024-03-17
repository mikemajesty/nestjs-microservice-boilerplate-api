import { z } from 'zod';

import { UserEntity } from '@/core/user/entity/user';
import { ApiTrancingInput, TracingType } from '@/utils/request';

// eslint-disable-next-line @typescript-eslint/ban-types
export const expectZodError = async (callback: Function, expected: Function) => {
  try {
    await callback();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(({ message, path }: z.ZodIssue) => ({ message, path: path[0] }));
      expected(issues);
    }
  }
};

export const getMockUUID = () => '9269248e-54cc-46f9-80c0-7029c989c0e3';

export const getMockDate = () => new Date('Sat Feb 10 2024 14:00:35');

export const getMockTracing = (): ApiTrancingInput => {
  return {
    tracing: {
      logEvent(key, value) {
        return key + value;
      },
      setStatus(event) {
        return event;
      }
    } as Partial<TracingType> as TracingType,
    user: { login: 'test' } as UserEntity
  };
};
