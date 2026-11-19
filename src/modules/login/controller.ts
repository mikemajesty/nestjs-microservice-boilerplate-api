/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/controller.md
 */
import { HttpCircuitBreaker } from '@mikemajesty/axios-circuit-breaker'
import { Controller, Get, Post, Req, Res, Version } from '@nestjs/common'
import { FastifyReply, FastifyRequest } from 'fastify'

import { IUserRepository } from '@/core/user/repository/user'
import { LoginInput, LoginOutput } from '@/core/user/use-cases/user-login'
import { RefreshTokenInput, RefreshTokenOutput } from '@/core/user/use-cases/user-refresh-token'
import { IHttpAdapter } from '@/infra/http'
import { ISecretsAdapter } from '@/infra/secrets'
import { ISessionAdapter } from '@/libs/session'
import { Public } from '@/utils/decorators'
import { BaseException } from '@/utils/exception'
import { ApiRequest } from '@/utils/request'

import { ILogin, IRefreshToken } from './interfaces'

@Controller()
@Public()
export class LoginController {
  constructor(
    private readonly loginUsecase: ILogin,
    private readonly refreshTokenUsecase: IRefreshToken,
    private readonly secret: ISecretsAdapter,
    private readonly http: IHttpAdapter,
    private readonly userRepository: IUserRepository,
    private readonly session: ISessionAdapter
  ) {}

  @Post('login')
  @Version('1')
  async login(@Req() { body, user, tracing }: ApiRequest): Promise<LoginOutput> {
    return this.loginUsecase.execute(body as LoginInput, { user, tracing })
  }

  @Post('refresh')
  @Version('1')
  async refresh(@Req() { body }: ApiRequest): Promise<RefreshTokenOutput> {
    return this.refreshTokenUsecase.execute(body as RefreshTokenInput)
  }

  @Get('login/google')
  @Version('1')
  loginGoogle(@Res() reply: FastifyReply): void {
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${this.secret.AUTH.GOOGLE.CLIENT_ID}&redirect_uri=${this.secret.AUTH.GOOGLE.REDIRECT_URL}&response_type=code&scope=profile email`
    reply.redirect(url)
  }

  @Get('login/google/callback')
  @Version('1')
  async loginGoogleCallback(@Req() request: FastifyRequest, @Res() reply: FastifyReply): Promise<void> {
    const { code } = request.query as { code?: string }

    if (!code) {
      reply.code(400).send({ error: 'Code is required' })
      return
    }

    const tokenResponse = await this.getToken(code)

    const { access_token } = tokenResponse

    const profile = await this.http
      .request()
      .get<GoogleProfile>('https://www.googleapis.com/oauth2/v1/userinfo')
      .headers({ Authorization: `Bearer ${access_token}` })
      .execute()

    if (!profile.verified_email) {
      reply.code(403).send({ error: 'Google email is not verified' })
      return
    }

    const user = await this.userRepository.findOne({ email: profile.email })

    if (!user) {
      reply.code(404).send({ error: `User: ${profile.email} not found` })
      return
    }

    const { accessToken, refreshToken } = await this.session.start(user)

    const fragment = new URLSearchParams({ accessToken, refreshToken })
    reply.redirect(`/home#${fragment}`)
  }

  @HttpCircuitBreaker({
    circuitGroup: 'google-oauth',
    getErrorCause: (error) => (error instanceof BaseException ? error.getCause<unknown>() : error)
  })
  private async getToken(code: string | undefined) {
    return await this.http
      .request()
      .post<GoogleTokenResponse>('https://oauth2.googleapis.com/token', {
        client_id: this.secret.AUTH.GOOGLE.CLIENT_ID,
        client_secret: this.secret.AUTH.GOOGLE.CLIENT_SECRET,
        code,
        redirect_uri: this.secret.AUTH.GOOGLE.REDIRECT_URL,
        grant_type: 'authorization_code'
      })
      .retry({ retries: 3 })
      .execute()
  }
}

type GoogleTokenResponse = {
  access_token: string
}

type GoogleProfile = {
  name: string
  email: string
  verified_email: boolean
}
