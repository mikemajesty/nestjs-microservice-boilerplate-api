import { z } from 'zod';

import { UserEntitySchema } from '@/core/user/entity/user';
import { CreatedModel } from '@/infra/repository';
import { PaginationInput, PaginationOutput, PaginationSchema } from '@/utils/pagination';

type Schema = z.infer<typeof UserEntitySchema>;

export const UserCreateSchema = UserEntitySchema.pick({
  clientId: true,
  clientSecret: true,
  roles: true
}).merge(z.object({ organization: z.string().trim().min(1).max(200) }));
export type UserCreateInput = z.infer<typeof UserCreateSchema>;
export type UserCreateOutput = Promise<CreatedModel>;

export const UserUpdateSchema = UserEntitySchema.pick({
  id: true
}).merge(UserCreateSchema.partial());
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;
export type UserUpdateOutput = Promise<Schema>;

export const UserListSchema = z.intersection(
  PaginationSchema,
  z.object({ filter: z.record(z.string().trim().min(1).max(200), z.string().trim().min(1).max(200)) }).partial()
);
export type UserListInput = { filter?: Partial<Schema> } & Omit<PaginationInput, 'total'>;
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
