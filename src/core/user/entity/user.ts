import { z } from 'zod';

import { RoleEntity, RoleEntitySchema } from '@/core/role/entity/role';
import { BaseEntity } from '@/utils/entity';

import { UserPasswordEntity, UserPasswordEntitySchema } from './user-password';

const ID = z.string().uuid();
const Email = z.string().email();
const Name = z.string();
const Password = UserPasswordEntitySchema;
const Role = RoleEntitySchema;
const CreatedAt = z.date().nullish();
const UpdatedAt = z.date().nullish();
const DeletedAt = z.date().default(null).nullish();

export const UserEntitySchema = z.object({
  id: ID,
  name: Name,
  email: Email,
  role: Role.optional(),
  password: Password.optional(),
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
  deletedAt: DeletedAt
});

type User = z.infer<typeof UserEntitySchema>;

export class UserEntity extends BaseEntity<UserEntity>() {
  name: string;

  email: string;

  role: RoleEntity;

  password: UserPasswordEntity;

  constructor(entity: User) {
    super(UserEntitySchema);
    Object.assign(this, this.validate(entity));
  }
}
