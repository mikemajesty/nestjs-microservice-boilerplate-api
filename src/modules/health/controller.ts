import { Controller, Get } from '@nestjs/common';
import os from 'os';

import { IHealthAdapter } from './adapter';
import { HealthOutput, HealthStatus } from './types';

@Controller()
export class HealthController {
  constructor(private readonly service: IHealthAdapter) {}

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
      server: HealthStatus.UP,
      mongoState,
      postgresState,
      redisState,
      memory,
      cpu
    };
  }
}
