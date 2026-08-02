/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/controller.md
 */
import { Body, Controller, Post } from '@nestjs/common'

import { ILoggerAdapter } from '@/infra/logger'
import { Public } from '@/utils/decorators'

@Controller('alert')
@Public()
export class AlertController {
  constructor(private readonly logger: ILoggerAdapter) {}

  @Post()
  handleAlert(@Body() body: unknown) {
    this.logger.warn({ message: '🔔 Alert received:\n' + JSON.stringify(body, null, 2) })
    return { status: 'ok' }
  }
}
