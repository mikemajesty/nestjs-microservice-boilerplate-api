import { Controller, HttpCode, Post, Put, Req, Version } from '@nestjs/common';
import { ApiBody, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

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
import { SwaggerRequest, SwaggerResponse } from './swagger';

@Controller('/reset-password')
@ApiTags('reset-password')
export class ResetPasswordController {
  constructor(
    private readonly sendEmailUsecase: ISendEmailResetPasswordAdapter,
    private readonly confirmResetPasswordUsecase: IConfirmResetPasswordAdapter
  ) {}

  @Post('send-email')
  @ApiResponse(SwaggerResponse.sendEmail[200])
  @ApiResponse(SwaggerResponse.sendEmail[404])
  @ApiBody(SwaggerRequest.sendEmail)
  @Version('1')
  async sendEmail(@Req() { body }: ApiRequest): Promise<ResetPasswordSendEmailOutput> {
    return await this.sendEmailUsecase.execute(body as ResetPasswordSendEmailInput);
  }

  @Put(':token')
  @ApiParam({ name: 'token', required: true })
  @ApiResponse(SwaggerResponse.confirm[200])
  @ApiResponse(SwaggerResponse.confirm[404])
  @ApiResponse(SwaggerResponse.confirm[401])
  @ApiResponse(SwaggerResponse.confirm[400])
  @ApiBody(SwaggerRequest.confirmResetPassword)
  @Version('1')
  @HttpCode(200)
  async confirmResetPassword(@Req() { params, body }: ApiRequest): Promise<ResetPasswordConfirmOutput> {
    return await this.confirmResetPasswordUsecase.execute({
      token: params.token,
      ...body
    } as ResetPasswordConfirmInput);
  }
}
