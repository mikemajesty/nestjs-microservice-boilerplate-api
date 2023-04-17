import { SaveOptions } from 'sequelize';
import { z } from 'zod';

export const DatabaseOptionsSchema = z.object({
  schema: z.string().trim().default('public'),
  transaction: z.any().optional().nullable()
});

export type DatabaseOptionsType = z.infer<typeof DatabaseOptionsSchema>;

export type SaveOptionsType = SaveOptions & DatabaseOptionsType;
