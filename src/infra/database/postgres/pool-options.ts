import { TimeoutBudget } from '@/utils/request/timeout-budget'

export const POSTGRES_POOL_OPTIONS = {
  max: 20,
  min: 5,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  query_timeout: TimeoutBudget.DEPENDENCY_TIMEOUT_MS,
  statement_timeout: TimeoutBudget.DEPENDENCY_TIMEOUT_MS,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
} as const
