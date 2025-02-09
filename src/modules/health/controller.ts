import { Controller, Get } from '@nestjs/common';
import os from 'os';

import { ICacheAdapter } from '@/infra/cache';
import { ILoggerAdapter } from '@/infra/logger';

import { IHealthAdapter } from './adapter';
import { HealthOutput } from './service';

@Controller()
export class HealthController {
  constructor(
    private readonly logger: ILoggerAdapter,
    private readonly service: IHealthAdapter,
    private readonly redis: ICacheAdapter
  ) {}

  @Get(['/health', '/'])
  async getHealth(): Promise<HealthOutput> {
    const memory = this.service.getMemoryUsageInMB();

    const numCpus = os.cpus().length;
    const [lastMinute, lastFiveMinutes, lastFifteenMinutes] = os.loadavg();

    const mongoState = this.service.getMongoStatus();
    const postgresState = await this.service.getPostgresStatus();
    const redisState = await this.service.getRedisStatus();

    const cpu = {
      healthyLimit: numCpus,
      loadAverage: {
        lastMinute: this.service.getLoadAvarage(lastMinute, numCpus),
        lastFiveMinutes: this.service.getLoadAvarage(lastFiveMinutes, numCpus),
        lastFifteenMinutes: this.service.getLoadAvarage(lastFifteenMinutes, numCpus)
      }
    };

    return {
      server: `UP`,
      mongoState,
      postgresState,
      redisState,
      memory,
      cpu
    };
  }
}
