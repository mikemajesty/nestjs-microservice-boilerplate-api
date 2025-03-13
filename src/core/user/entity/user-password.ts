import { CryptoUtils } from '@/utils/crypto';
import { BaseEntity } from '@/utils/entity';
import { ApiBadRequestException } from '@/utils/exception';
import { Infer, InputValidator } from '@/utils/validator';

const ID = InputValidator.string().uuid();
const Password = InputValidator.string();
const CreatedAt = InputValidator.date().nullish();
const UpdatedAt = InputValidator.date().nullish();
const DeletedAt = InputValidator.date().nullish();

export const UserPasswordEntitySchema = InputValidator.object({
  id: ID,
  password: Password,
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
  deletedAt: DeletedAt
});

type UserPassword = Infer<typeof UserPasswordEntitySchema>;

export class UserPasswordEntity extends BaseEntity<UserPasswordEntity>() {
  password!: string;

  constructor(entity: UserPassword) {
    super(UserPasswordEntitySchema);
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
