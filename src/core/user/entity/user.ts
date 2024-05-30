import { z } from 'zod';

import { BaseEntity } from '@/utils/entity';

export enum UserRole {
  USER = 'USER',
  BACKOFFICE = 'BACKOFFICE'
}

const ID = z.string().uuid();
const Email = z.string().email();
const Password = z.string().trim().min(1).max(200);
const CreatedAt = z.date().nullish();
const Roles = z.array(z.nativeEnum(UserRole));
const UpdatedAt = z.date().nullish();
const DeletedAt = z.date().default(null).nullish();

export const UserEntitySchema = z.object({
  id: ID,
  email: Email,
  password: Password,
  roles: Roles,
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
  deletedAt: DeletedAt
});

type User = z.infer<typeof UserEntitySchema>;

export class UserEntity extends BaseEntity<UserEntity>(UserEntitySchema) {
  email: string;

  password: string;

  roles: UserRole[];

  constructor(entity: User) {
    super();
    Object.assign(this, this.validate(entity));
  }

  anonymizePassword() {
    this.password = '**********';
  }
}
