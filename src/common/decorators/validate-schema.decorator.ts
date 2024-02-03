import { Schema } from 'zod';

export function ValidateSchema(schema: Schema) {
  return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: unknown[]) {
      const model = schema.parse(args[0]);
      args[0] = model;
      const result = originalMethod.apply(this, args);
      return result;
    };
  };
}
