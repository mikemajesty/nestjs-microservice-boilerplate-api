import { faker } from '@faker-js/faker';
import z from 'zod';

type AllType = number | string | boolean | Date | object | null | undefined;

export class EntityMock<T> {
  constructor(private readonly schema: z.ZodSchema<T>) {}

  create(overrides?: Partial<T>): T {
    const mockData = this.generateMockData(this.schema);
    const merged = { ...(mockData as object), ...overrides };
    return this.schema.parse(merged);
  }

  createMany(count: number, overrides?: Partial<T>): T[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  private generateMockData(schema: z.core.$ZodType): AllType {
    if (this.isUUIDSchema(schema)) {
      return faker.string.uuid();
    }

    if (schema instanceof z.ZodString) {
      if (this.hasStringCheck(schema, 'email')) return faker.internet.email();
      if (this.hasStringCheck(schema, 'url')) return faker.internet.url();
      if (this.hasStringCheck(schema, 'uuid')) return faker.string.uuid();
      return faker.lorem.words(2);
    }

    if (schema instanceof z.ZodNumber) {
      return faker.number.int({ min: 1, max: 100 });
    }

    if (schema instanceof z.ZodBoolean) {
      return faker.datatype.boolean();
    }

    if (schema instanceof z.ZodDate) {
      return faker.date.recent();
    }

    if (schema instanceof z.ZodArray) {
      return Array.from({ length: 2 }, () => this.generateMockData(schema.element));
    }

    if (schema instanceof z.ZodObject) {
      const mockData: Record<string, AllType> = {};
      const shape = schema.shape;

      for (const [key, fieldSchema] of Object.entries(shape)) {
        mockData[key] = this.generateMockData(fieldSchema as z.ZodTypeAny);
      }

      return mockData;
    }

    if (schema instanceof z.ZodEnum) {
      return faker.helpers.arrayElement(schema.options);
    }

    if (schema instanceof z.ZodOptional) {
      return this.generateMockData(schema.def.innerType);
    }

    if (schema instanceof z.ZodNullable) {
      return this.generateMockData(schema.def.innerType);
    }

    if (schema instanceof z.ZodDefault) {
      const def = schema.def;
      const defaultValue = def.defaultValue as any;

      if (defaultValue !== undefined) return defaultValue;
      return this.generateMockData(def.innerType);
    }

    if (schema instanceof z.ZodLazy) {
      return this.generateMockData(schema.def.getter());
    }

    if (schema instanceof z.ZodAny || schema instanceof z.ZodUnknown) {
      return this.generateAnyValue();
    }

    if (schema instanceof z.ZodVoid) return undefined;
    if (schema instanceof z.ZodNull) return null;

    return null;
  }

  private isUUIDSchema(schema: z.core.$ZodType): boolean {
    if (schema instanceof z.ZodString) {
      return this.hasStringCheck(schema, 'uuid');
    }
    return false;
  }

  private hasStringCheck(schema: z.ZodString, type: 'email' | 'url' | 'uuid'): boolean {
    const checks = schema.def?.checks ?? [];

    return checks.some((check: any) => check.kind === 'string_format' && check.format === type);
  }

  private generateAnyValue(): AllType {
    const types = ['string', 'number', 'boolean', 'date', 'array', 'object'] as const;
    const randomType = faker.helpers.arrayElement(types);

    switch (randomType) {
      case 'string':
        return faker.lorem.words(2);
      case 'number':
        return faker.number.int(100);
      case 'boolean':
        return faker.datatype.boolean();
      case 'date':
        return faker.date.recent();
      case 'array':
        return Array.from({ length: 2 }, () => faker.lorem.word());
      case 'object':
        return { [faker.lorem.word()]: faker.lorem.words(2) };
      default:
        return null;
    }
  }
}
