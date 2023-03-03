import { z } from 'zod';

import { withID } from '@/utils/entity';

const ID = z.string().uuid();
const ClientId = z.string().trim().min(1).max(200);
const ClientSecret = z.string().trim().min(1).max(200);
const CreatedAt = z.date().nullish();
const UpdatedAt = z.date().nullish();
const DeletedAt = z.date().default(null).nullish();

const Organization = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(200)
});

export enum UserRole {
  USER = 'USER',
  BACKOFFICE = 'BACKOFFICE'
}

export const UserEntitySchema = z.object({
  id: ID,
  clientId: ClientId,
  clientSecret: ClientSecret,
  organization: Organization,
  roles: z.array(z.nativeEnum(UserRole)),
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
  deletedAt: DeletedAt
});

type User = z.infer<typeof UserEntitySchema>;

type Organization = z.infer<typeof Organization>;

export class UserEntity {
  id: string;

  clientId: string;

  clientSecret: string;

  organization: Organization;

  roles: UserRole[];

  createdAt?: Date;

  updatedAt?: Date;

  deletedAt?: Date;

  constructor(entity: User) {
    if (!entity) return;
    Object.assign(this, UserEntitySchema.parse(withID(entity)));
  }

  setDelete() {
    this.deletedAt = new Date();
  }
}
