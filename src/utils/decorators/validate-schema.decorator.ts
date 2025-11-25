import zod from 'zod';

export function ValidateSchema(...schema: zod.Schema[]) {
  return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: unknown[]) {
      const validatorError: { error?: zod.ZodError | null; issues: zod.ZodIssue[] } = {
        issues: [],
        error: null
      };

      for (const [index, value] of schema.entries()) {
        try {
          const model = value.parse(args[`${index}`]) as { [key: string]: unknown };

          for (const key in model) {
            if (model[`${key}`] === undefined) {
              delete model[`${key}`];
            }
          }

          args[`${index}`] = model;
        } catch (error) {
          Object.assign(validatorError, { error });
          validatorError.issues.push(...(validatorError.error as zod.ZodError).issues);
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
