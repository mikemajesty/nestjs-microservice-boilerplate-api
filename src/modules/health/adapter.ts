import { Connection } from 'mongoose';
import { RedisClientType } from 'redis';
import { DataSource } from 'typeorm';

import { ICacheAdapter } from '@/infra/cache';

import { Load, MemotyOutput } from './service';

export abstract class IHealthAdapter {
  abstract mongo: Connection;
  abstract postgres: DataSource;
  abstract redis: ICacheAdapter<RedisClientType>;
  abstract getMongoStatus(): 'UP' | 'DOWN';
  abstract getRedisStatus(): Promise<'UP' | 'DOWN'>;
  abstract getPostgresStatus(): Promise<'UP' | 'DOWN'>;
  abstract getMemoryUsageInMB(): MemotyOutput;
  abstract getLoadAvarage(time: number, numCpus: number): Load;
}
