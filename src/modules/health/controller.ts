import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { II18nAdapter } from '@/libs/i18n';

import { name, version } from '../../../package.json';

@Controller()
@ApiTags('health')
export class HealthController {
  constructor(private readonly i18n: II18nAdapter) {}

  @Get(['/health', '/'])
  async getHealth(): Promise<unknown> {
    const hello = this.i18n.translate('info.HELLO');
    return `${hello}, ${name}:${version} available!`;
  }
}
