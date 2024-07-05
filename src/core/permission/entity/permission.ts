import { z } from 'zod';

import { BaseEntity, withID } from '@/utils/entity';

const ID = z.string().uuid();
const Name = z.string();
const CreatedAt = z.date().nullish();
const UpdatedAt = z.date().nullish();
const DeletedAt = z.date().default(null).nullish();

export const PermissionEntitySchema = z.object({
  id: ID,
  name: Name,
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
  deletedAt: DeletedAt
});

type Permission = z.infer<typeof PermissionEntitySchema>;

export class PermissionEntity extends BaseEntity<PermissionEntity>() {
  name: string;

  constructor(entity: Permission) {
    super(PermissionEntitySchema);
    Object.assign(this, PermissionEntitySchema.parse(withID(entity)));
  }
}
