import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { name, version } from '../../../package.json';

@Controller()
@ApiTags('health')
export class HealthController {
  @Get(['/health', '/'])
  async getHealth(): Promise<string> {
    return `${name}:${version} available!`;
  }
}
