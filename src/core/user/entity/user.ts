/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/entity.md
 */
import { RoleEntity, RoleEntitySchema } from '@/core/role/entity/role'
import { BaseEntity } from '@/utils/domain'
import { InferSchema, Schema } from '@/utils/schema'

import { UserPasswordEntity, UserPasswordEntitySchema } from './user-password'

const ID = Schema.uuid()
const Email = Schema.email()
const Name = Schema.string()
const Password = UserPasswordEntitySchema
const CreatedAt = Schema.date().nullish()
const UpdatedAt = Schema.date().nullish()
const DeletedAt = Schema.date().nullish()

export const UserEntitySchema = Schema.object({
  id: ID,
  name: Name,
  email: Email,
  roles: Schema.array(RoleEntitySchema.optional().optional()).default([]),
  password: Password.optional(),
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
  deletedAt: DeletedAt
})

type User = InferSchema<typeof UserEntitySchema>

export class UserEntity extends BaseEntity<UserEntity>() {
  name!: User['name']

  email!: User['email']

  roles!: RoleEntity[]

  password!: UserPasswordEntity

  constructor(entity: User) {
    super(UserEntitySchema)
    this.validate(entity)
    this.ensureID()
  }
}
