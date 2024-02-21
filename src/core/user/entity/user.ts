import { z } from 'zod';

import { BaseEntity } from '@/utils/entity';

const ID = z.string().uuid();
const Login = z.string().trim().min(1).max(200);
const Password = z.string().trim().min(1).max(200);
const CreatedAt = z.date().nullish();
const UpdatedAt = z.date().nullish();
const DeletedAt = z.date().default(null).nullish();

export enum UserRole {
  USER = 'USER',
  BACKOFFICE = 'BACKOFFICE'
}

export const UserEntitySchema = z.object({
  id: ID,
  login: Login,
  password: Password,
  roles: z.array(z.nativeEnum(UserRole)),
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
  deletedAt: DeletedAt
});

type User = z.infer<typeof UserEntitySchema>;

export class UserEntity extends BaseEntity<UserEntity>() {
  login: string;

  password: string;

  roles: UserRole[];

  constructor(entity: User) {
    super(UserEntitySchema);
    Object.assign(this, this.validate(entity));
  }

  anonymizePassword() {
    this.password = '**********';
  }
}
