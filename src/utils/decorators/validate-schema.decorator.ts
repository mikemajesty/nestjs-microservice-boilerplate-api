import { Schema } from 'zod';

export function ValidateSchema(...schema: Schema[]) {
  return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: unknown[]) {
      for (const [index, value] of schema.entries()) {
        const model = value.parse(args[`${index}`]);
        args[`${index}`] = model;
      }
      const result = originalMethod.apply(this, args);
      return result;
    };
  };
}
