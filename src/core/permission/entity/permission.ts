import { RoleEntity } from '@/core/role/entity/role';
import { BaseEntity } from '@/utils/entity';
import { Infer, InputValidator } from '@/utils/validator';

const ID = InputValidator.string().uuid();
const Name = InputValidator.string()
  .transform((value) => value.trim().replace(/ /g, '_').toLowerCase())
  .refine((val) => val.includes(':'), {
    message: "permission must contains ':'"
  });
const CreatedAt = InputValidator.date().nullish().optional();
const UpdatedAt = InputValidator.date().nullish().optional();
const DeletedAt = InputValidator.date().nullish().optional();
const Roles = InputValidator.array(InputValidator.unknown()).optional();

export const PermissionEntitySchema = InputValidator.object({
  id: ID,
  name: Name,
  roles: Roles,
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
  deletedAt: DeletedAt
});

type Permission = Infer<typeof PermissionEntitySchema>;

export class PermissionEntity extends BaseEntity<PermissionEntity>() {
  name!: string;

  roles?: RoleEntity[];

  constructor(entity: Permission) {
    super(PermissionEntitySchema);
    Object.assign(this, this.validate(entity));
  }
}
