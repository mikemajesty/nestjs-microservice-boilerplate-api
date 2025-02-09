import { Connection } from 'mongoose';
import { RedisClientType } from 'redis';
import { DataSource } from 'typeorm';
import v8 from 'v8';

import { ICacheAdapter } from '@/infra/cache';
import { ErrorType, ILoggerAdapter } from '@/infra/logger';
import { ApiInternalServerException } from '@/utils/exception';

import { IHealthAdapter } from './adapter';
import { HealthStatus, Load } from './types';

export class HealthService implements IHealthAdapter {
  postgres!: DataSource;
  mongo!: Connection;
  redis!: ICacheAdapter<RedisClientType>;

  constructor(private readonly logger: ILoggerAdapter) {}

  getMemoryUsageInMB() {
    const processMemory = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();

    return {
      process: {
        ramUsed: `${this.bytesToMB(processMemory.rss)} MB`,
        heapTotal: `${this.bytesToMB(processMemory.heapTotal)} MB`,
        heapUsed: `${this.bytesToMB(processMemory.heapUsed)} MB`,
        external: `${this.bytesToMB(processMemory.external)} MB`
      },
      v8: {
        totalHeapSize: `${this.bytesToMB(heapStats.total_heap_size)} MB`,
        usedHeapSize: `${this.bytesToMB(heapStats.used_heap_size)} MB`,
        executableHeapSize: `${this.bytesToMB(heapStats.total_heap_size_executable)} MB`,
        heapSizeLimit: `${this.bytesToMB(heapStats.heap_size_limit)} MB`
      }
    };
  }

  getLoadAvarage(time: number, numCpus: number): Load {
    const STATUS = time < numCpus ? 'healthy 🟢' : 'overloaded 🔴';
    if (STATUS === 'overloaded 🔴') {
      this.logger.warn({ message: `CPU ${STATUS} `, context: HealthService.name });
    }
    return { load: time, status: STATUS };
  }

  async getPostgresStatus() {
    try {
      const result = await this.postgres.query('SELECT 1');

      return result ? HealthStatus.UP : HealthStatus.DOWN;
    } catch (error) {
      error = this.buildError(error, `${HealthService.name}/postgres`);
      this.logger.error(error as ErrorType);
      return HealthStatus.DOWN;
    }
  }

  getMongoStatus() {
    try {
      return this.mongo.readyState === 1 ? HealthStatus.UP : HealthStatus.DOWN;
    } catch (error) {
      error = this.buildError(error, `${HealthService.name}/mongo`);
      this.logger.error(error as ErrorType);
      return HealthStatus.DOWN;
    }
  }

  async getRedisStatus() {
    try {
      const status = await this.redis.ping();
      return status === 'PONG' ? HealthStatus.UP : HealthStatus.DOWN;
    } catch (error) {
      error = this.buildError(error, `${HealthService.name}/redis`);
      this.logger.error(error as ErrorType);
      return HealthStatus.DOWN;
    }
  }

  private buildError(error: unknown, context: string) {
    if (typeof error === 'string') {
      error = new ApiInternalServerException(error);
    }
    (error as { context: string }).context = context;
    return error;
  }

  private bytesToMB = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2);
  };
}
