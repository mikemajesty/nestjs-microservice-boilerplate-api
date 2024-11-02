import { z } from 'zod';

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

export const PermissionEntitySchema = z.object({
  id: ID,
  name: Name,
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
  deletedAt: DeletedAt
});

type Permission = z.infer<typeof PermissionEntitySchema>;

export class PermissionEntity extends BaseEntity<PermissionEntity>(PermissionEntitySchema) {
  name!: string;

  constructor(entity: Permission) {
    super();
    Object.assign(this, this.validate(entity));
  }
}
