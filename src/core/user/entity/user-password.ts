import { z } from 'zod';

import { CryptoUtils } from '@/utils/crypto';
import { BaseEntity } from '@/utils/entity';
import { ApiBadRequestException } from '@/utils/exception';

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

  createPassword() {
    this.password = CryptoUtils.createHash(this.password);
    return this.password;
  }

  verifyPassword(password: string) {
    if (this.password !== password) {
      throw new ApiBadRequestException('incorrectPassword');
    }
  }
}
