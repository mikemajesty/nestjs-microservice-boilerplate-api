/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/usecase.md
 */
import { ISessionAdapter } from '@/libs/session'
import { ValidateSchema } from '@/utils/decorators'
import { ApiUnauthorizedException } from '@/utils/exception'
import { PasswordUtils } from '@/utils/password'
import { ApiTracingInput } from '@/utils/request'
import { InferSchema } from '@/utils/schema'
import { IUsecase } from '@/utils/usecase'

import { UserEntitySchema } from '../entity/user'
import { UserPasswordEntitySchema } from '../entity/user-password'
import { IUserRepository } from '../repository/user'

export const LoginSchema = UserEntitySchema.pick({
  email: true
}).and(UserPasswordEntitySchema.pick({ password: true }))

export class LoginUsecase implements IUsecase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly session: ISessionAdapter
  ) {}

  @ValidateSchema(LoginSchema)
  async execute(input: LoginInput, { tracing }: ApiTracingInput): Promise<LoginOutput> {
    const user = await this.userRepository.findOneWithRelation(
      {
        email: input.email
      },
      { password: true }
    )

    const passwordMatches = await PasswordUtils.compare(input.password, user?.password.password)

    if (!user || !passwordMatches) {
      throw new ApiUnauthorizedException('invalidCredentials')
    }

    tracing.logEvent('user-login', { action: 'login', by: user.id, entity: user.id })

    return this.session.start(user)
  }
}

export type LoginInput = InferSchema<typeof LoginSchema>
export type LoginOutput = { accessToken: string; refreshToken: string }
