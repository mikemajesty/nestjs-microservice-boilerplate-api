import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';

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
  async login(@Body() input: LoginInput): LoginOutput {
    const model = LoginSchema.parse(input);
    return this.loginService.execute(model);
  }
}
