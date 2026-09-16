import { DistributedLockTryAcquireLockInput, DistributedLockTryAcquireLockOutput } from './service'

export abstract class IDistributedLockAdapter {
  abstract tryAcquireLock(input: DistributedLockTryAcquireLockInput): Promise<DistributedLockTryAcquireLockOutput>
}
