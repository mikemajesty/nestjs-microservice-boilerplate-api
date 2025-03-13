import { RoleEntity, RoleEntitySchema } from '@/core/role/entity/role';
import { BaseEntity } from '@/utils/entity';
import { Infer, InputValidator } from '@/utils/validator';

import { UserPasswordEntity, UserPasswordEntitySchema } from './user-password';

const ID = InputValidator.string().uuid();
const Email = InputValidator.string().email();
const Name = InputValidator.string();
const Password = UserPasswordEntitySchema;
const Role = RoleEntitySchema;
const CreatedAt = InputValidator.date().nullish();
const UpdatedAt = InputValidator.date().nullish();
const DeletedAt = InputValidator.date().nullish();

export const UserEntitySchema = InputValidator.object({
  id: ID,
  name: Name,
  email: Email,
  roles: InputValidator.array(Role.optional()).min(1),
  password: Password.optional(),
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
  deletedAt: DeletedAt
});

type User = Infer<typeof UserEntitySchema>;

export class UserEntity extends BaseEntity<UserEntity>() {
  name!: string;

  email!: string;

  roles!: RoleEntity[];

  password!: UserPasswordEntity;

  constructor(entity: User) {
    super(UserEntitySchema);
    Object.assign(this, this.validate(entity));
  }
}
