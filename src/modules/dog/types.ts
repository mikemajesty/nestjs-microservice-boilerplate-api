import { z } from 'zod';

import { DogEntitySchema } from '@/core/dog/entity/dog';
import { CreatedModel } from '@/infra/repository';
import { PaginationInput, PaginationOutput, PaginationSchema } from '@/utils/pagination';
import { SearchSchema } from '@/utils/search';
import { SortSchema } from '@/utils/sort';

type Schema = z.infer<typeof DogEntitySchema>;

export const DogCreateSchema = DogEntitySchema.pick({
  name: true,
  breed: true,
  age: true
});

export type DogCreateInput = z.infer<typeof DogCreateSchema>;
export type DogCreateOutput = Promise<CreatedModel>;

export const DogUpdateSchema = DogEntitySchema.pick({
  name: true
})
  .partial()
  .merge(DogEntitySchema.pick({ id: true }));

export type DogUpdateInput = z.infer<typeof DogUpdateSchema>;
export type DogUpdateOutput = Promise<Schema>;

export const DogGetByIdSchema = DogEntitySchema.pick({
  id: true
});
export type DogGetByIDInput = z.infer<typeof DogGetByIdSchema>;
export type DogGetByIDOutput = Promise<Schema>;

export const DogListSchema = z.intersection(PaginationSchema, SortSchema.merge(SearchSchema));

export type DogListInput = PaginationInput<Schema>;
export type DogListOutput = Promise<{ docs: Schema[] } & PaginationOutput>;

export const DogDeleteSchema = DogEntitySchema.pick({
  id: true
});
export type DogDeleteInput = z.infer<typeof DogDeleteSchema>;
export type DogDeleteOutput = Promise<Schema>;
