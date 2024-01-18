import { z } from 'zod';

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
