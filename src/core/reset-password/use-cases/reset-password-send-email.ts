/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/usecase.md
 */
import { UserEntity, UserEntitySchema } from '@/core/user/entity/user'
import { IUserRepository } from '@/core/user/repository/user'
import { SendEmailInput } from '@/infra/email'
import { ISecretsAdapter } from '@/infra/secrets'
import { IEventAdapter } from '@/libs/event'
import { EventNameEnum } from '@/libs/event/types'
import { ITokenAdapter } from '@/libs/token'
import { ValidateSchema } from '@/utils/decorators'
import { ApiNotFoundException } from '@/utils/exception'
import { IDGeneratorUtils } from '@/utils/id-generator'
import { InferSchema } from '@/utils/schema'
import { IUsecase } from '@/utils/usecase'

import { ResetPasswordEntity } from '../entity/reset-password'
import { IResetPasswordRepository } from '../repository/reset-password'

/** Claim that marks a token as a password-reset token, so access tokens cannot be used to reset a password. */
export const RESET_PASSWORD_TOKEN_PURPOSE = 'password-reset'

export const ResetPasswordSendEmailSchema = UserEntitySchema.pick({
  email: true
})

export class ResetPasswordSendEmailUsecase implements IUsecase {
  constructor(
    private readonly resetPasswordRepository: IResetPasswordRepository,
    private readonly userRepository: IUserRepository,
    private readonly token: ITokenAdapter,
    private readonly event: IEventAdapter,
    private readonly secret: ISecretsAdapter
  ) {}

  @ValidateSchema(ResetPasswordSendEmailSchema)
  async execute({ email }: ResetPasswordSendEmailInput): Promise<ResetPasswordSendEmailOutput> {
    const user = await this.userRepository.findOne({ email })

    if (!user) {
      throw new ApiNotFoundException('user not found')
    }

    const resetPassword = await this.resetPasswordRepository.findByIdUserId(user.id)

    if (resetPassword) {
      this.sendEmail(user, resetPassword.token)
      return
    }

    const hash = this.token.sign({ body: { id: user.id, purpose: RESET_PASSWORD_TOKEN_PURPOSE } })
    const entity = new ResetPasswordEntity({ id: IDGeneratorUtils.uuid(), token: hash.token, user })

    await this.resetPasswordRepository.create(entity.toData())
    this.sendEmail(user, hash.token)
  }

  private sendEmail(user: UserEntity, token: string) {
    this.event.emit<SendEmailInput>(EventNameEnum.SEND_EMAIL, {
      email: user.email,
      subject: 'Reset password',
      template: 'reque-reset-password',
      payload: { name: user.name, link: `${this.secret.HOST}/api/v1/reset-password/${token}` }
    })
  }
}

export type ResetPasswordSendEmailInput = InferSchema<typeof ResetPasswordSendEmailSchema>
export type ResetPasswordSendEmailOutput = void
