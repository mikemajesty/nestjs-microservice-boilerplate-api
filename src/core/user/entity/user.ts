import { z } from 'zod';

import { IEntity, withID } from '@/utils/entity';

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

export class UserEntity implements IEntity {
  id: string;

  login: string;

  password: string;

  roles: UserRole[];

  createdAt: Date;

  updatedAt: Date;

  deletedAt?: Date;

  static nameof = (name: keyof UserEntity) => name;

  constructor(entity: User) {
    Object.assign(this, UserEntitySchema.parse(withID(entity)));
  }

  setDelete() {
    this.deletedAt = new Date();
  }

  anonymizePassword() {
    this.password = '**********';
  }
}
