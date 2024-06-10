import { z } from 'zod';

import { BaseEntity } from '@/utils/entity';
import { ApiBadRequestException, ApiNotFoundException } from '@/utils/exception';

export enum UserRole {
  USER = 'USER',
  BACKOFFICE = 'BACKOFFICE'
}

const ID = z.string().uuid();
const Password = z.string();
const CreatedAt = z.date().nullish();
const UpdatedAt = z.date().nullish();
const DeletedAt = z.date().default(null).nullish();

export const UserPasswordEntitySchema = z.object({
  id: ID,
  password: Password,
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
  deletedAt: DeletedAt
});

type UserPassword = z.infer<typeof UserPasswordEntitySchema>;

export class UserPasswordEntity extends BaseEntity<UserPasswordEntity>(UserPasswordEntitySchema) {
  password: string;

  constructor(entity: UserPassword) {
    super();
    Object.assign(this, this.validate(entity));
  }

  verifyPassword(password: string) {
    if (!password) {
      throw new ApiNotFoundException('passwordNotFound');
    }

    if (this.password !== password) {
      throw new ApiBadRequestException('incorrectPassword');
    }
  }
}
