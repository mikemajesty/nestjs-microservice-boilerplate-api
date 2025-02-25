import { Controller, HttpCode, Post, Put, Req, Version } from '@nestjs/common';

import {
  ResetPasswordConfirmInput,
  ResetPasswordConfirmOutput
} from '@/core/reset-password/use-cases/reset-password-confirm';
import {
  ResetPasswordSendEmailInput,
  ResetPasswordSendEmailOutput
} from '@/core/reset-password/use-cases/reset-password-send-email';
import { ApiRequest } from '@/utils/request';

import { IConfirmResetPasswordAdapter, ISendEmailResetPasswordAdapter } from './adapter';

@Controller('/reset-password')
export class ResetPasswordController {
  constructor(
    private readonly sendEmailUsecase: ISendEmailResetPasswordAdapter,
    private readonly confirmResetPasswordUsecase: IConfirmResetPasswordAdapter
  ) {}

  @Post('send-email')
  @Version('1')
  async sendEmail(@Req() { body }: ApiRequest): Promise<ResetPasswordSendEmailOutput> {
    return await this.sendEmailUsecase.execute(body as ResetPasswordSendEmailInput);
  }

  @Put(':token')
  @Version('1')
  @HttpCode(200)
  async confirmResetPassword(@Req() { params, body }: ApiRequest): Promise<ResetPasswordConfirmOutput> {
    return await this.confirmResetPasswordUsecase.execute({
      token: params.token,
      ...body
    } as ResetPasswordConfirmInput);
  }
}
