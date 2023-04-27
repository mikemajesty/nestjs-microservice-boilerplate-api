import { Controller, Post, Req } from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';

import { LoginInput, LoginOutput } from '@/core/user/use-cases/user-login';
import { ApiRequest } from '@/utils/request';

import { ILoginAdapter } from './adapter';
import { SwagggerRequest, SwagggerResponse } from './swagger';

@Controller()
@ApiTags('login')
export class LoginController {
  constructor(private readonly loginService: ILoginAdapter) {}

  @Post('/login')
  @ApiResponse(SwagggerResponse.login[200])
  @ApiResponse(SwagggerResponse.login[404])
  @ApiBody(SwagggerRequest.body)
  async login(@Req() { body }: ApiRequest): LoginOutput {
    return this.loginService.execute(body as LoginInput);
  }
}
