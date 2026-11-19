/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/usecase.md
 */
import { UserEntity } from '@/core/user/entity/user'
import { UserPasswordEntity } from '@/core/user/entity/user-password'
import { IUserRepository } from '@/core/user/repository/user'
import { SendEmailInput } from '@/infra/email'
import { IEventAdapter } from '@/libs/event'
import { EventNameEnum } from '@/libs/event/types'
import { ISessionAdapter } from '@/libs/session'
import { ITokenAdapter } from '@/libs/token'
import { ValidateSchema } from '@/utils/decorators'
import { ApiBadRequestException, ApiNotFoundException, ApiUnauthorizedException } from '@/utils/exception'
import { InferSchema, Schema } from '@/utils/schema'
import { IUsecase } from '@/utils/usecase'

import { IResetPasswordRepository } from '../repository/reset-password'
import { RESET_PASSWORD_TOKEN_PURPOSE } from './reset-password-send-email'

export const ResetPasswordConfirmSchema = Schema.object({
  token: Schema.string(),
  password: Schema.string().min(5).max(200),
  confirmPassword: Schema.string().min(5).max(200)
})

export class ResetPasswordConfirmUsecase implements IUsecase {
  constructor(
    private readonly resetPasswordTokenRepository: IResetPasswordRepository,
    private readonly userRepository: IUserRepository,
    private readonly token: ITokenAdapter,
    private readonly event: IEventAdapter,
    private readonly session: ISessionAdapter
  ) {}

  @ValidateSchema(ResetPasswordConfirmSchema)
  async execute(input: ResetPasswordConfirmInput): Promise<ResetPasswordConfirmOutput> {
    const samePassword = input.password === input.confirmPassword

    if (!samePassword) {
      throw new ApiBadRequestException('passwords are different')
    }

    const user = await this.findUserByResetToken(input.token)

    const passwordEntity = new UserPasswordEntity(user.password)

    await passwordEntity.changePassword(input.password)
    user.password = passwordEntity

    await this.userRepository.create(user.toData())

    await this.session.revokeAll(user.id)

    this.event.emit<SendEmailInput>(EventNameEnum.SEND_EMAIL, {
      email: user.email,
      subject: 'Password has been changed successfully',
      template: 'reset-password',
      payload: { name: user.name }
    })

    await this.resetPasswordTokenRepository.remove({ userId: user.id })
  }

  private async findUserByResetToken(resetToken: string): Promise<UserEntity> {
    const token = await this.token.verify<ResetPasswordConfirmVerify>({ token: resetToken })
    const isResetToken = token.purpose === RESET_PASSWORD_TOKEN_PURPOSE

    if (!isResetToken) {
      throw new ApiUnauthorizedException('invalidToken')
    }

    const user = await this.userRepository.findOneWithRelation({ id: token.id }, { password: true })

    if (!user) {
      throw new ApiNotFoundException('user not found')
    }

    await this.ensurePendingToken(user.id, resetToken)

    return user
  }

  private async ensurePendingToken(userId: string, resetToken: string): Promise<void> {
    const pending = await this.resetPasswordTokenRepository.findByIdUserId(userId)
    const isPendingToken = pending?.token === resetToken

    if (!isPendingToken) {
      throw new ApiUnauthorizedException('token was expired')
    }
  }
}

export type ResetPasswordConfirmInput = InferSchema<typeof ResetPasswordConfirmSchema>
export type ResetPasswordConfirmOutput = void

export type ResetPasswordConfirmVerify = {
  id: string
  purpose: typeof RESET_PASSWORD_TOKEN_PURPOSE
}
