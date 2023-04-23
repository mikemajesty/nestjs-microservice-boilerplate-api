import { Controller, Post, Req } from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ApiRequest } from '@/utils/request';

import { ILoginAdapter } from './adapter';
import { SwagggerRequest, SwagggerResponse } from './swagger';
import { LoginInput, LoginOutput, LoginSchema } from './types';

@Controller()
@ApiTags('login')
export class LoginController {
  constructor(private readonly loginService: ILoginAdapter) {}

  @Post('/login')
  @ApiResponse(SwagggerResponse.login[200])
  @ApiResponse(SwagggerResponse.login[404])
  @ApiBody(SwagggerRequest.body)
  async login(@Req() { body, tracing }: ApiRequest): LoginOutput {
    const input = LoginSchema.parse(body as LoginInput);
    tracing.addTags({ body });
    return this.loginService.execute(input);
  }
}
