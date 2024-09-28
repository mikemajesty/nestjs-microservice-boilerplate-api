import { z } from 'zod';

import { BaseEntity } from '@/utils/entity';

const ID = z.string().uuid();
const Name = z.string().trim().min(1).max(200);
const Breed = z.string().trim().min(1).max(200);
const Age = z.number().min(0).max(30);
const CreatedAt = z.date().nullish();
const UpdatedAt = z.date().nullish();
const DeletedAt = z.date().default(null).nullish();

export const CatEntitySchema = z.object({
  id: ID,
  name: Name,
  breed: Breed,
  age: Age,
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
  deletedAt: DeletedAt
});

type Cat = z.infer<typeof CatEntitySchema>;

export class CatEntity extends BaseEntity<CatEntity>(CatEntitySchema) {
  name: string;

  breed: string;

  age: number;

  constructor(entity: Cat) {
    super();
    Object.assign(this, this.validate(entity));
  }
}
