/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/controller.md
 */
import { Controller, Post, Req } from '@nestjs/common'

import { ILoggerAdapter } from '@/infra/logger'
import { Public } from '@/utils/decorators'
import { ApiRequest } from '@/utils/request'

@Controller('alert')
@Public()
export class AlertController {
  constructor(private readonly logger: ILoggerAdapter) {}

  @Post()
  handleAlert(@Req() { body }: ApiRequest) {
    this.logger.warn({ message: '🔔 Alert received:\n' + JSON.stringify(body, null, 2) })
    return { status: 'ok' }
  }
}
