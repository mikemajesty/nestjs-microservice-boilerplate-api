/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/entity.md
 */
import { UserEntity, UserEntitySchema } from '@/core/user/entity/user'
import { BaseEntity } from '@/utils/domain'
import { InferSchema, Schema } from '@/utils/schema'

const ID = Schema.uuid()
const Token = Schema.string().min(1).trim()
const User = UserEntitySchema
const CreatedAt = Schema.date().nullish()
const UpdatedAt = Schema.date().nullish()
const DeletedAt = Schema.date().nullish()

export const ResetPasswordEntitySchema = Schema.object({
  id: ID,
  token: Token,
  user: User.optional(),
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
  deletedAt: DeletedAt
})

type ResetPassword = InferSchema<typeof ResetPasswordEntitySchema>

export class ResetPasswordEntity extends BaseEntity<ResetPasswordEntity>() {
  token!: ResetPassword['token']

  user!: UserEntity

  constructor(entity: ResetPassword) {
    super(ResetPasswordEntitySchema)
    this.validate(entity)
    this.ensureID()
  }
}
