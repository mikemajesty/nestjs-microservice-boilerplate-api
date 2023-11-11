import { Controller, HttpCode, Post, Req, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';

import { LogoutInput, LogoutOutput } from '@/core/user/use-cases/user-logout';
import { ApiRequest } from '@/utils/request';

import { ILogoutAdapter } from './adapter';
import { SwagggerRequest, SwagggerResponse } from './swagger';

@Controller()
@ApiTags('logout')
@ApiBearerAuth()
export class LogoutController {
  constructor(private readonly logoutService: ILogoutAdapter) {}

  @Post('/logout')
  @ApiResponse(SwagggerResponse.logout[200])
  @ApiBody(SwagggerRequest.body)
  @HttpCode(401)
  @Version('1')
  async logout(@Req() { body, user, tracing }: ApiRequest): LogoutOutput {
    return this.logoutService.execute(body as LogoutInput, { user, tracing });
  }
}
