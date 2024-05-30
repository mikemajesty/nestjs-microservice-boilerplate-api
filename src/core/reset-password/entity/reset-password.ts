import { z } from 'zod';

import { BaseEntity } from '@/utils/entity';

const ID = z.string().uuid();
const UserId = z.string();
const Token = z.string().min(1).trim();
const CreatedAt = z.date().nullish();
const UpdatedAt = z.date().nullish();
const DeletedAt = z.date().default(null).nullish();

export const ResetPasswordEntitySchema = z.object({
  id: ID,
  token: Token,
  userId: UserId,
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
  deletedAt: DeletedAt
});

type ResetPassword = z.infer<typeof ResetPasswordEntitySchema>;

export class ResetPasswordEntity extends BaseEntity<ResetPasswordEntity>(ResetPasswordEntitySchema) {
  token: string;

  userId: string;

  constructor(entity: ResetPassword) {
    super();
    Object.assign(this, this.validate(entity));
  }
}
