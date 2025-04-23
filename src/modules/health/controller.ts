import { Controller, Get } from '@nestjs/common';

import { ILoggerAdapter } from '@/infra/logger';

import { ApiInternalServerException } from './../../utils/exception';
import { IHealthAdapter } from './adapter';
import { HealthOutput } from './types';

@Controller()
export class HealthController {
  constructor(
    private readonly service: IHealthAdapter,
    private readonly logger: ILoggerAdapter
  ) {}

  @Get(['/health', '/'])
  async getHealth(): Promise<HealthOutput> {
    throw new ApiInternalServerException();
  }
}
