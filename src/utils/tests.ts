import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import { UserEntity } from '@/core/user/entity/user';

import { ApiTrancingInput, TracingType } from './request';

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

export const generateUUID = () => uuidv4();

export const trancingMock: ApiTrancingInput = {
  tracing: {
    logEvent(key, value) {
      return key + value;
    },
    log(event) {
      return event;
    }
  } as Partial<TracingType> as TracingType,
  user: { login: 'test' } as UserEntity
};
