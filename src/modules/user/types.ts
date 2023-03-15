import { z } from 'zod';

import { UserEntitySchema } from '@/core/user/entity/user';
import { CreatedModel } from '@/infra/repository';
import { PaginationInput, PaginationOutput, PaginationSchema } from '@/utils/pagination';
import { SearchSchema } from '@/utils/search';
import { SortSchema } from '@/utils/sort';

type Schema = z.infer<typeof UserEntitySchema>;

export const UserCreateSchema = UserEntitySchema.pick({
  login: true,
  password: true,
  roles: true
});

export type UserCreateInput = z.infer<typeof UserCreateSchema>;
export type UserCreateOutput = Promise<CreatedModel>;

export const UserUpdateSchema = UserEntitySchema.pick({
  id: true
}).merge(UserCreateSchema.partial());
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;
export type UserUpdateOutput = Promise<Schema>;

export const UserListSchema = z.intersection(PaginationSchema, SortSchema.merge(SearchSchema));

export type UserListInput = PaginationInput<Schema>;
export type UserListOutput = Promise<{ docs: Schema[] } & PaginationOutput>;

export const UserDeleteSchema = UserEntitySchema.pick({
  id: true
});
export type UserDeleteInput = z.infer<typeof UserDeleteSchema>;
export type UserDeleteOutput = Promise<Schema>;

export const UserGetByIdSchema = UserEntitySchema.pick({
  id: true
});
export type UserGetByIDInput = z.infer<typeof UserGetByIdSchema>;
export type UserGetByIDOutput = Promise<Schema>;
