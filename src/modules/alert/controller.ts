import { Body, Controller, Post } from '@nestjs/common';

import { ILoggerAdapter } from '@/infra/logger';

@Controller('alert')
export class AlertController {
  constructor(private readonly logger: ILoggerAdapter) {}

  @Post()
  handleAlert(@Body() body: unknown) {
    this.logger.warn({ message: '🔔 Alerta received:\n' + JSON.stringify(body, null, 2) });
    return { status: 'ok' };
  }
}
