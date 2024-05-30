import { Controller, HttpCode, Post, Put, Req, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Roles } from '@/common/decorators';
import { ConfirmResetPasswordInput, ConfirmResetPasswordOutput } from '@/core/reset-password/use-cases/confirm';
import { SendEmailResetPasswordInput, SendEmailResetPasswordOutput } from '@/core/reset-password/use-cases/send-email';
import { UserRole } from '@/core/user/entity/user';
import { ApiRequest } from '@/utils/request';

import { IConfirmResetPasswordAdapter, ISendEmailResetPasswordAdapter } from './adapter';
import { SwaggerRequest, SwaggerResponse } from './swagger';

@Controller('/reset-password')
@ApiTags('reset-password')
@ApiBearerAuth()
@Roles(UserRole.USER, UserRole.BACKOFFICE)
export class ResetPasswordController {
  constructor(
    private readonly sendEmailUsecase: ISendEmailResetPasswordAdapter,
    private readonly confirmResetPasswordUsecase: IConfirmResetPasswordAdapter
  ) {}

  @Post('send-email')
  @ApiResponse(SwaggerResponse.sendEmail[200])
  @ApiResponse(SwaggerResponse.sendEmail[404])
  @ApiBody(SwaggerRequest.sendEmailBody)
  @Version('1')
  async sendEmail(@Req() { body }: ApiRequest): Promise<SendEmailResetPasswordOutput> {
    return await this.sendEmailUsecase.execute(body as SendEmailResetPasswordInput);
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
  async receive(@Req() { params, body }: ApiRequest): Promise<ConfirmResetPasswordOutput> {
    return await this.confirmResetPasswordUsecase.execute({
      token: params.token,
      ...body
    } as ConfirmResetPasswordInput);
  }
}
