import { Connection } from 'mongoose';
import { RedisClientType } from 'redis';
import { DataSource } from 'typeorm';

import { ICacheAdapter } from '@/infra/cache';

import { DatabaseConnection, HealthStatus, Load, MemotyOutput } from './types';

export abstract class IHealthAdapter {
  abstract mongo: Connection;
  abstract postgres: DataSource;
  abstract redis: ICacheAdapter<RedisClientType>;
  abstract getMongoStatus(): HealthStatus;
  abstract getRedisStatus(): Promise<HealthStatus>;
  abstract getPostgresStatus(): Promise<HealthStatus>;
  abstract getMemoryUsageInMB(): MemotyOutput;
  abstract getLoadAvarage(time: number, numCpus: number): Load;
  abstract getActiveConnections(): Promise<unknown>;
  abstract getLatency(host?: string): Promise<unknown>;
  abstract getMongoConnections(): Promise<DatabaseConnection>;
  abstract getPostgresConnections(): Promise<DatabaseConnection>;
  abstract getCPUCore(): Promise<{ cpus: { load: number }[] }>;
}
