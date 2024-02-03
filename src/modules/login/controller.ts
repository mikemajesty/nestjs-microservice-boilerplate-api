import { Controller, Post, Req, Version } from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';

import { LoginInput, LoginOutput } from '@/core/user/use-cases/user-login';
import { ApiRequest } from '@/utils/request';

import { ILoginAdapter } from './adapter';
import { SwaggerRequest, SwaggerResponse } from './swagger';

@Controller()
@ApiTags('login')
export class LoginController {
  constructor(private readonly loginService: ILoginAdapter) {}

  @Post('/login')
  @ApiResponse(SwaggerResponse.login[200])
  @ApiResponse(SwaggerResponse.login[404])
  @ApiBody(SwaggerRequest.body)
  @Version('1')
  async login(@Req() { body, user, tracing }: ApiRequest): LoginOutput {
    return this.loginService.execute(body as LoginInput, { user, tracing });
  }
}
