/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/usecase.md
 */
import { ValidateSchema } from '@/utils/decorators'
import { ApiBadRequestException, ApiNotFoundException } from '@/utils/exception'
import { IUsecase } from '@/utils/usecase'
import { Infer, InputValidator } from '@/utils/validator'

import { UserEntitySchema } from '../entity/user'
import { UserPasswordEntity } from '../entity/user-password'
import { IUserRepository } from '../repository/user'

export const UserChangePasswordSchema = UserEntitySchema.pick({
  id: true
}).and(
  InputValidator.object({
    password: InputValidator.string(),
    newPassword: InputValidator.string(),
    confirmPassword: InputValidator.string()
  })
)

export class UserChangePasswordUsecase implements IUsecase {
  constructor(private readonly repository: IUserRepository) {}

  @ValidateSchema(UserChangePasswordSchema)
  async execute(input: UserChangePasswordInput): Promise<UserChangePasswordOutput> {
    const user = await this.repository.findOneWithRelation({ id: input.id }, { password: true })

    if (!user) {
      throw new ApiNotFoundException('userNotFound')
    }

    const entityPassword = new UserPasswordEntity(user.password)

    entityPassword.matchesPassword(input.password)

    if (input.newPassword !== input.confirmPassword) {
      throw new ApiBadRequestException('passwordIsDifferent')
    }

    entityPassword.changePassword(input.newPassword)

    await this.repository.create(user)
  }
}

export type UserChangePasswordInput = Infer<typeof UserChangePasswordSchema>
export type UserChangePasswordOutput = void
