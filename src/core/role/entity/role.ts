import { z } from 'zod';

import { PermissionEntity, PermissionEntitySchema } from '@/core/permission/entity/permission';
import { BaseEntity, withID } from '@/utils/entity';

export enum RoleEnum {
  USER = 'USER',
  BACKOFFICE = 'BACKOFFICE'
}

const ID = z.string().uuid();
const Name = z.nativeEnum(RoleEnum);
const Permissions = z.array(PermissionEntitySchema).optional();
const CreatedAt = z.date().nullish();
const UpdatedAt = z.date().nullish();
const DeletedAt = z.date().default(null).nullish();

export const RoleEntitySchema = z.object({
  id: ID,
  name: Name,
  permissions: Permissions,
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
  deletedAt: DeletedAt
});

type Role = z.infer<typeof RoleEntitySchema>;

export class RoleEntity extends BaseEntity<RoleEntity>(RoleEntitySchema) {
  name: RoleEnum;

  permissions: PermissionEntity[];

  constructor(entity: Role) {
    super();
    Object.assign(this, RoleEntitySchema.parse(withID(entity)));
  }
}
