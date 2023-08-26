import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import { UserEntity } from '@/core/user/entity/user';

import { ApiTrancingInput } from './request';

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
    addTags: jest.fn(),
    axios: jest.fn(),
    createSpan: jest.fn(),
    finish: jest.fn(),
    log: jest.fn(),
    logEvent: jest.fn(),
    setTag: jest.fn(),
    span: null,
    tags: null,
    tracer: null,
    tracerId: 'testeId'
  },
  user: { login: 'test' } as UserEntity
};
