import { UserEntity, UserEntitySchema } from '@/core/user/entity/user';
import { BaseEntity } from '@/utils/entity';
import { Infer, InputValidator } from '@/utils/validator';

const ID = InputValidator.string().uuid();
const Token = InputValidator.string().min(1).trim();
const User = UserEntitySchema;
const CreatedAt = InputValidator.date().nullish();
const UpdatedAt = InputValidator.date().nullish();
const DeletedAt = InputValidator.date().nullish();

export const ResetPasswordEntitySchema = InputValidator.object({
  id: ID,
  token: Token,
  user: User.optional(),
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
  deletedAt: DeletedAt
});

type ResetPassword = Infer<typeof ResetPasswordEntitySchema>;

export class ResetPasswordEntity extends BaseEntity<ResetPasswordEntity>() {
  token!: string;

  user!: UserEntity;

  constructor(entity: ResetPassword) {
    super(ResetPasswordEntitySchema);
    Object.assign(this, this.validate(entity));
  }
}
