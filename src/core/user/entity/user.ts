import { z } from 'zod';

import { BaseEntity } from '@/utils/entity';

import { UserPasswordEntity, UserPasswordEntitySchema } from './user-password';

export enum UserRoleEnum {
  USER = 'USER',
  BACKOFFICE = 'BACKOFFICE'
}

const ID = z.string().uuid();
const Email = z.string().email();
const Name = z.string();
const Roles = z.array(z.nativeEnum(UserRoleEnum));
const Password = UserPasswordEntitySchema;
const CreatedAt = z.date().nullish();
const UpdatedAt = z.date().nullish();
const DeletedAt = z.date().default(null).nullish();

export const UserEntitySchema = z.object({
  id: ID,
  name: Name,
  email: Email,
  roles: Roles,
  password: Password.optional(),
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
  deletedAt: DeletedAt
});

type User = z.infer<typeof UserEntitySchema>;

export class UserEntity extends BaseEntity<UserEntity>(UserEntitySchema) {
  name: string;

  email: string;

  roles: UserRoleEnum[];

  password: UserPasswordEntity;

  constructor(entity: User) {
    super();
    Object.assign(this, this.validate(entity));
  }
}
