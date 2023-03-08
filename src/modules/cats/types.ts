import { z } from 'zod';

import { CatsEntitySchema } from '@/core/cats/entity/cats';
import { CreatedModel } from '@/infra/repository';
import { PaginationInput, PaginationOutput, PaginationSchema } from '@/utils/pagination';

type Schema = z.infer<typeof CatsEntitySchema>;

export const CatsCreateSchema = CatsEntitySchema.pick({
  name: true,
  breed: true,
  age: true
});

export type CatsCreateInput = z.infer<typeof CatsCreateSchema>;
export type CatsCreateOutput = Promise<CreatedModel>;

export const CatsUpdateSchema = CatsEntitySchema.pick({
  name: true,
  breed: true,
  age: true
})
  .partial()
  .merge(CatsEntitySchema.pick({ id: true }));

export type CatsUpdateInput = z.infer<typeof CatsUpdateSchema>;
export type CatsUpdateOutput = Promise<Schema>;

export const CatsGetByIdSchema = CatsEntitySchema.pick({
  id: true
});
export type CatsGetByIDInput = z.infer<typeof CatsGetByIdSchema>;
export type CatsGetByIDOutput = Promise<Schema>;

export const CatsListSchema = PaginationSchema;

export type CatsListInput = PaginationInput;
export type CatsListOutput = Promise<{ docs: Schema[] } & PaginationOutput>;

export const CatsDeleteSchema = CatsEntitySchema.pick({
  id: true
});
export type CatsDeleteInput = z.infer<typeof CatsDeleteSchema>;
export type CatsDeleteOutput = Promise<Schema>;
