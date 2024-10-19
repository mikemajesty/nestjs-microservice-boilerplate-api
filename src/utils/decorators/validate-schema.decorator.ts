import { Schema } from 'zod';

export function ValidateSchema(...schema: Schema[]) {
  return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: unknown[]) {
      try {
        for (const [index, value] of schema.entries()) {
          const model = value.parse(args[`${index}`]);
          args[`${index}`] = model;
        }
      } catch (error) {
        throw error;
      }
      const result = originalMethod.apply(this, args);
      return result;
    };
  };
}
