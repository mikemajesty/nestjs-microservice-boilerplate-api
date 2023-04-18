import { SaveOptions } from 'sequelize';
import { z } from 'zod';

//you can use a dynamic schema
const DEFAULT_SCHEMA = 'public';

export const DatabaseOptionsSchema = z
  .object({
    schema: z.string().trim().default(DEFAULT_SCHEMA),
    transaction: z.any().optional().nullable()
  })
  .default({
    schema: DEFAULT_SCHEMA
  });

export type DatabaseOptionsType = z.infer<typeof DatabaseOptionsSchema>;

export type SaveOptionsType = SaveOptions & DatabaseOptionsType;
