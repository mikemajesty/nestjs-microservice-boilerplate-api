/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/controller.md
 */
import { Controller, HttpCode, Post, Req, Version } from '@nestjs/common'

import { LogoutOutput } from '@/core/user/use-cases/user-logout'
import { Permission } from '@/utils/decorators'
import { ApiRequest } from '@/utils/request'

import { ILogout } from './interfaces'

@Controller()
export class LogoutController {
  constructor(private readonly logoutUsecase: ILogout) {}

  @Post('/logout')
  @HttpCode(204)
  @Version('1')
  @Permission('user:logout')
  async logout(@Req() { user, tracing }: ApiRequest): Promise<LogoutOutput> {
    return this.logoutUsecase.execute({ user, tracing })
  }
}
