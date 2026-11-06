/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/infra/distributed-lock.md
 */
import { DistributedLockTryAcquireLockInput, DistributedLockTryAcquireLockOutput } from './service'

export abstract class IDistributedLockAdapter {
  abstract tryAcquireLock(input: DistributedLockTryAcquireLockInput): Promise<DistributedLockTryAcquireLockOutput>
}
