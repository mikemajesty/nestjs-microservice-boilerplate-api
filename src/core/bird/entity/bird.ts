import { z } from 'zod';

import { IEntity, withID } from '@/utils/entity';

const ID = z.string().uuid();
const Name = z.string().min(1).max(200).trim();
const CreatedAt = z.date().nullish();
const UpdatedAt = z.date().nullish();
const DeletedAt = z.date().default(null).nullish();

export const BirdEntitySchema = z.object({
  id: ID,
  name: Name,
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
  deletedAt: DeletedAt
});

type Bird = z.infer<typeof BirdEntitySchema>;

export class BirdEntity implements IEntity {
  id: string;

  name: string;

  deletedAt?: Date;

  createdAt: Date;

  updatedAt: Date;

  constructor(entity: Bird) {
    Object.assign(this, BirdEntitySchema.parse(withID(entity)));
  }

  setDelete() {
    this.deletedAt = new Date();
  }
}
