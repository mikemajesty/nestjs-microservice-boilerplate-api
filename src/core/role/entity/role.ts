import { PermissionEntity, PermissionEntitySchema } from '@/core/permission/entity/permission';
import { BaseEntity } from '@/utils/entity';
import { Infer, InputValidator } from '@/utils/validator';

export enum RoleEnum {
  USER = 'USER',
  BACKOFFICE = 'BACKOFFICE'
}

const ID = InputValidator.string().uuid();
const Name = InputValidator.string().transform((value) => value.trim().replace(/ /g, '_').toUpperCase());
const Permissions = InputValidator.array(PermissionEntitySchema).optional();
const CreatedAt = InputValidator.date().nullish();
const UpdatedAt = InputValidator.date().nullish();
const DeletedAt = InputValidator.date().optional().nullish();

export const RoleEntitySchema = InputValidator.object({
  id: ID,
  name: Name,
  permissions: Permissions,
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
  deletedAt: DeletedAt
});

type Role = Infer<typeof RoleEntitySchema>;

export class RoleEntity extends BaseEntity<RoleEntity>() {
  name!: RoleEnum;

  permissions!: PermissionEntity[];

  constructor(entity: Role) {
    super(RoleEntitySchema);
    Object.assign(this, this.validate(entity));
  }
}
