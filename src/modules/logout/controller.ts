import { Controller, HttpCode, Post, Req, Version } from '@nestjs/common';

import { LogoutInput, LogoutOutput } from '@/core/user/use-cases/user-logout';
import { Permission } from '@/utils/decorators';
import { ApiRequest } from '@/utils/request';

import { ILogoutAdapter } from './adapter';

@Controller()
export class LogoutController {
  constructor(private readonly logoutUsecase: ILogoutAdapter) {}

  @Post('/logout')
  @HttpCode(401)
  @Version('1')
  @Permission('user:logout')
  async logout(@Req() { body, user, tracing }: ApiRequest): LogoutOutput {
    return this.logoutUsecase.execute(body as LogoutInput, { user, tracing });
  }
}
