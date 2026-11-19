/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/entity.md
 */
import { BaseEntity } from '@/utils/domain'
import { ApiBadRequestException, ApiConflictException } from '@/utils/exception'
import { PasswordUtils } from '@/utils/password'
import { InferSchema, Schema } from '@/utils/schema'

const ID = Schema.uuid()
const Password = Schema.string()
const CreatedAt = Schema.date().nullish()
const UpdatedAt = Schema.date().nullish()
const DeletedAt = Schema.date().nullish()

export const UserPasswordEntitySchema = Schema.object({
  id: ID,
  password: Password,
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
  deletedAt: DeletedAt
})

type UserPassword = InferSchema<typeof UserPasswordEntitySchema>

export class UserPasswordEntity extends BaseEntity<UserPasswordEntity>() {
  password!: UserPassword['password']

  constructor(entity: UserPassword) {
    super(UserPasswordEntitySchema)
    this.validate(entity)
    this.ensureID()
  }

  async createPassword(): Promise<void> {
    if (PasswordUtils.isHash(this.password)) {
      throw new ApiConflictException('Password is already hashed')
    }

    this.password = await PasswordUtils.hash(this.password)
  }

  async matchesPassword(plainPassword: string): Promise<boolean> {
    return PasswordUtils.compare(plainPassword, this.password)
  }

  async verifyPassword(plainPassword: string): Promise<void> {
    if (!(await this.matchesPassword(plainPassword))) {
      throw new ApiBadRequestException('incorrectPassword')
    }
  }

  async changePassword(newPassword: string): Promise<void> {
    this.password = await PasswordUtils.hash(newPassword)
  }
}
