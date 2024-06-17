import { Controller, HttpCode, Post, Req, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';

import { LogoutInput, LogoutOutput } from '@/core/user/use-cases/user-logout';
import { Permission } from '@/utils/decorators';
import { ApiRequest } from '@/utils/request';

import { ILogoutAdapter } from './adapter';
import { SwaggerRequest, SwaggerResponse } from './swagger';

@Controller()
@ApiTags('logout')
@ApiBearerAuth()
export class LogoutController {
  constructor(private readonly logoutUsecase: ILogoutAdapter) {}

  @Post('/logout')
  @ApiResponse(SwaggerResponse.logout[401])
  @ApiBody(SwaggerRequest.logout)
  @HttpCode(401)
  @Version('1')
  @Permission('user:logout')
  async logout(@Req() { body, user, tracing }: ApiRequest): LogoutOutput {
    return this.logoutUsecase.execute(body as LogoutInput, { user, tracing });
  }
}
