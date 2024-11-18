import { z } from 'zod';

import { RoleEntity } from '@/core/role/entity/role';
import { BaseEntity } from '@/utils/entity';

const ID = z.string().uuid();
const Name = z
  .string()
  .transform((value) => value.trim().replace(/ /g, '_').toLowerCase())
  .refine((val) => val.includes(':'), {
    message: "permission must contains ':'"
  });
const CreatedAt = z.date().nullish().optional();
const UpdatedAt = z.date().nullish().optional();
const DeletedAt = z.date().nullish().optional();
const Roles = z.array(z.unknown()).optional();

export const PermissionEntitySchema = z.object({
  id: ID,
  name: Name,
  roles: Roles,
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
  deletedAt: DeletedAt
});

type Permission = z.infer<typeof PermissionEntitySchema>;

export class PermissionEntity extends BaseEntity<PermissionEntity>() {
  name!: string;

  roles?: RoleEntity[];

  constructor(entity: Permission) {
    super(PermissionEntitySchema);
    Object.assign(this, this.validate(entity));
  }
}
