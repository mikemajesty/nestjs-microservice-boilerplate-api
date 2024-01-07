import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { IHttpAdapter } from '@/infra/http';

import { name, version } from '../../../package.json';

@Controller()
@ApiTags('health')
export class HealthController {
  constructor(private readonly http: IHttpAdapter) {}
  @Get(['/health', '/'])
  async getHealth(): Promise<string> {
    await this.http.instance().get('https://httpstat.us/410', { timeout: 1 });
    return `${name}:${version} available!`;
  }
}
