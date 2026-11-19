/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/module.md
 */
import type { Server } from 'node:net'

import { Redis } from 'ioredis'
import { Connection } from 'mongoose'
import { DataSource } from 'typeorm'

import { ICacheAdapter } from '@/infra/cache'

import { DependenciesSnapshot, MetricsOutput } from './types'

export abstract class IHealthAdapter {
  abstract mongo: Connection
  abstract postgres: DataSource
  abstract redis: ICacheAdapter<Redis>
  abstract cache: IHealthCacheAdapter
  abstract checkDependencies(): Promise<DependenciesSnapshot>
  abstract getMetrics(server: Server): Promise<MetricsOutput>
}

/**
 * Health-scoped cache token. Reuses the ICacheAdapter signatures but exposes only what health
 * needs, and gets its own instance so it never collides with the shared ICacheAdapter token.
 */
export abstract class IHealthCacheAdapter {
  abstract get: ICacheAdapter['get']
  abstract set: ICacheAdapter['set']
}
