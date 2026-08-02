/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/controller.md
 */
import { Controller, HttpCode, Post, Put, Req, Version } from '@nestjs/common'

import {
  ResetPasswordConfirmInput,
  ResetPasswordConfirmOutput
} from '@/core/reset-password/use-cases/reset-password-confirm'
import {
  ResetPasswordSendEmailInput,
  ResetPasswordSendEmailOutput
} from '@/core/reset-password/use-cases/reset-password-send-email'
import { Public } from '@/utils/decorators'
import { ApiRequest } from '@/utils/request'

import { IConfirmResetPasswordAdapter, ISendEmailResetPasswordAdapter } from './adapter'

@Controller('/reset-password')
@Public()
export class ResetPasswordController {
  constructor(
    private readonly sendEmailUsecase: ISendEmailResetPasswordAdapter,
    private readonly confirmResetPasswordUsecase: IConfirmResetPasswordAdapter
  ) {}

  @Post('send-email')
  @Version('1')
  async sendEmail(@Req() { body }: ApiRequest): Promise<ResetPasswordSendEmailOutput> {
    return await this.sendEmailUsecase.execute(body as ResetPasswordSendEmailInput)
  }

  @Put(':token')
  @Version('1')
  @HttpCode(200)
  async confirmResetPassword(@Req() { params, body }: ApiRequest): Promise<ResetPasswordConfirmOutput> {
    return await this.confirmResetPasswordUsecase.execute({
      token: params.token,
      ...body
    } as ResetPasswordConfirmInput)
  }
}
