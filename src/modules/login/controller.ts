import { Controller, Get, Post, Req, Res, Version } from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';

import { IUserRepository } from '@/core/user/repository/user';
import { LoginInput, LoginOutput } from '@/core/user/use-cases/user-login';
import { IHttpAdapter } from '@/infra/http';
import { ISecretsAdapter } from '@/infra/secrets';
import { ITokenAdapter } from '@/libs/token';
import { ApiRequest } from '@/utils/request';

import { ILoginAdapter } from './adapter';
import { SwaggerRequest, SwaggerResponse } from './swagger';

@Controller('login')
@ApiTags('login')
export class LoginController {
  constructor(
    private readonly loginUsecase: ILoginAdapter,
    private readonly secret: ISecretsAdapter,
    private readonly http: IHttpAdapter,
    private readonly userRepository: IUserRepository,
    private readonly tokenService: ITokenAdapter
  ) {}

  @Post()
  @ApiResponse(SwaggerResponse.login[200])
  @ApiResponse(SwaggerResponse.login[404])
  @ApiBody(SwaggerRequest.login)
  @Version('1')
  async login(@Req() { body, user, tracing }: ApiRequest): LoginOutput {
    return this.loginUsecase.execute(body as LoginInput, { user, tracing });
  }

  @Get('/google')
  @Version('1')
  loginGoogle(@Res() res: Response): void {
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${this.secret.AUTH.GOOGLE.CLIENT_ID}&redirect_uri=${this.secret.AUTH.GOOGLE.REDIRECT_URL}&response_type=code&scope=profile email`;
    res.redirect(url);
  }

  @Get('/google/callback')
  @Version('1')
  async loginGoogleCallback(@Res() res: Response, @Req() req: Request): Promise<void> {
    const { code } = req.query;
    const http = this.http.instance();
    const { data } = await http.post('https://oauth2.googleapis.com/token', {
      client_id: this.secret.AUTH.GOOGLE.CLIENT_ID,
      client_secret: this.secret.AUTH.GOOGLE.CLIENT_SECRET,
      code,
      redirect_uri: this.secret.AUTH.GOOGLE.REDIRECT_URL,
      grant_type: 'authorization_code'
    });

    const { access_token } = data;

    const { data: profile } = await http.get<{ name: string; email: string }>(
      'https://www.googleapis.com/oauth2/v1/userinfo',
      {
        headers: { Authorization: `Bearer ${access_token}` }
      }
    );

    const user = await this.userRepository.findOneWithRelation(
      { email: profile.email },
      { password: true, role: true }
    );

    const tokenNewPassword = this.tokenService.sign({
      email: user.email,
      name: profile.name
    });

    if (!user?.password) {
      res.redirect(`/create-new-password=${tokenNewPassword.token}`);
      return;
    }

    const tokenAuthorization = this.tokenService.sign({
      email: user.email,
      name: profile.name,
      role: user.role.name
    });

    res.redirect(`/home?token=${tokenAuthorization.token}`);
  }
}
