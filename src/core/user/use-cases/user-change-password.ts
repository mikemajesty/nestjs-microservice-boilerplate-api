/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/usecase.md
 */
import { ISessionAdapter } from '@/libs/session'
import { ValidateSchema } from '@/utils/decorators'
import { ApiBadRequestException, ApiNotFoundException } from '@/utils/exception'
import { InferSchema, Schema } from '@/utils/schema'
import { IUsecase } from '@/utils/usecase'

import { UserEntitySchema } from '../entity/user'
import { UserPasswordEntity } from '../entity/user-password'
import { IUserRepository } from '../repository/user'

export const UserChangePasswordSchema = UserEntitySchema.pick({
  id: true
}).and(
  Schema.object({
    password: Schema.string(),
    newPassword: Schema.string(),
    confirmPassword: Schema.string()
  })
)

export class UserChangePasswordUsecase implements IUsecase {
  constructor(
    private readonly repository: IUserRepository,
    private readonly session: ISessionAdapter
  ) {}

  @ValidateSchema(UserChangePasswordSchema)
  async execute(input: UserChangePasswordInput): Promise<UserChangePasswordOutput> {
    const user = await this.repository.findOneWithRelation({ id: input.id }, { password: true })

    if (!user) {
      throw new ApiNotFoundException('userNotFound')
    }

    const entityPassword = new UserPasswordEntity(user.password)

    await entityPassword.verifyPassword(input.password)

    if (input.newPassword !== input.confirmPassword) {
      throw new ApiBadRequestException('passwordIsDifferent')
    }

    await entityPassword.changePassword(input.newPassword)

    user.password = entityPassword

    await this.repository.create(user)

    await this.session.revokeAll(user.id)
  }
}

export type UserChangePasswordInput = InferSchema<typeof UserChangePasswordSchema>
export type UserChangePasswordOutput = void
