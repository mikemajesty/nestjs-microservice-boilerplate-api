import { z } from 'zod';

import { BaseEntity, withID } from '@/utils/entity';

export enum PermissionEnum {
  ALL = 'all'
}

const ID = z.string().uuid();
const Name = z.nativeEnum(PermissionEnum).or(z.string());
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

export class PermissionEntity extends BaseEntity<PermissionEntity>(PermissionEntitySchema) {
  name: PermissionEnum | string;

  constructor(entity: Permission) {
    super();
    Object.assign(this, PermissionEntitySchema.parse(withID(entity)));
  }
}
