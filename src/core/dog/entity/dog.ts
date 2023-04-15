import { z } from 'zod';

import { IEntity, withID } from '@/utils/entity';

const ID = z.string().uuid();
const Name = z.string().trim().min(1).max(200);
const Breed = z.string().trim().min(1).max(200);
const Age = z.number().min(0).max(30);
const CreatedAt = z.date().nullish();
const UpdatedAt = z.date().nullish();
const DeletedAt = z.date().default(null).nullish();

export const DogEntitySchema = z.object({
  id: ID,
  name: Name,
  breed: Breed,
  age: Age,
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
  deletedAt: DeletedAt
});

type Dog = z.infer<typeof DogEntitySchema>;

export class DogEntity implements IEntity {
  id: string;

  name: string;

  breed: string;

  age: number;

  deletedAt?: Date;

  createdAt: Date;

  updatedAt: Date;

  constructor(entity: Dog) {
    Object.assign(this, DogEntitySchema.parse(withID(entity)));
  }

  setDelete() {
    this.deletedAt = new Date();
  }
}
