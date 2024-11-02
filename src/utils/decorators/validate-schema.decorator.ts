import { Schema, ZodError, ZodIssue } from 'zod';

export function ValidateSchema(...schema: Schema[]) {
  return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: unknown[]) {
      const validatorError: { error?: ZodError | null; issues: ZodIssue[] } = {
        issues: [],
        error: null
      };

      for (const [index, value] of schema.entries()) {
        try {
          const model = value.parse(args[`${index}`]);
          args[`${index}`] = model;
        } catch (error) {
          Object.assign(validatorError, { error });
          validatorError.issues.push(...(validatorError.error as ZodError).issues);
        }
      }

      if (validatorError.error) {
        const error = validatorError.error;
        error.issues = validatorError.issues;
        throw error;
      }

      const result = originalMethod.apply(this, args);
      return result;
    };
  };
}
