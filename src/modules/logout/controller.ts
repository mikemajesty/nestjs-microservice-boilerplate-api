import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ILogoutAdapter } from './adapter';
import { SwagggerRequest, SwagggerResponse } from './swagger';
import { LogoutInput, LogoutOutput } from './types';

@Controller()
@ApiTags('logout')
@ApiBearerAuth()
export class LogoutController {
  constructor(private readonly logoutService: ILogoutAdapter) {}

  @Post('/logout')
  @ApiResponse(SwagggerResponse.logout[200])
  @ApiBody(SwagggerRequest.body)
  @HttpCode(401)
  async logout(@Body() input: LogoutInput): LogoutOutput {
    return this.logoutService.execute(input);
  }
}
