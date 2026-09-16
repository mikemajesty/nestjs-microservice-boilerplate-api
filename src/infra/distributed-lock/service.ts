import { Injectable } from '@nestjs/common'

import { ValidateSchema } from '@/utils/decorators'
import { IDGeneratorUtils } from '@/utils/id-generator'
import { InputValidator, SchemaInfer } from '@/utils/validator'

import { ICacheAdapter } from '../cache'
import { IDistributedLockAdapter } from './adapter'

const DistributedLockSchema = InputValidator.object({
  key: InputValidator.string().trim(),
  ttlSeconds: InputValidator.number().int().positive()
})

const RELEASE_LOCK_SCRIPT = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
  else
    return 0
  end
  end
`

@Injectable()
export class DistributedLockService implements IDistributedLockAdapter {
  private readonly lockPrefix = 'distributed-lock'

  constructor(private readonly cache: ICacheAdapter) {}

  @ValidateSchema(DistributedLockSchema)
  async tryAcquireLock({
    key,
    ttlSeconds
  }: DistributedLockTryAcquireLockInput): Promise<DistributedLockTryAcquireLockOutput> {
    const lockKey = this.buildLockKey(key)
    const token = IDGeneratorUtils.generate(`uuid`)

    const acquired = await this.acquire(lockKey, token, ttlSeconds)
    if (!acquired) return null

    return async () => {
      await this.release(lockKey, token)
    }
  }

  private buildLockKey(key: string): string {
    return `${this.lockPrefix}:${key}`
  }

  private async acquire(lockKey: string, token: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.cache.client.set(lockKey, token, 'EX', ttlSeconds, 'NX')
    return result === 'OK'
  }

  private async release(lockKey: string, token: string): Promise<void> {
    await this.cache.client.eval(RELEASE_LOCK_SCRIPT, 1, lockKey, token)
  }
}

export type DistributedLockGetInput = SchemaInfer<typeof DistributedLockSchema>
export type DistributedLockGetOutput = DistributedLockGetInput

export type DistributedLockReleaseLockFn = () => Promise<void>

export type DistributedLockTryAcquireLockOutput = DistributedLockReleaseLockFn | null
export type DistributedLockTryAcquireLockInput = SchemaInfer<typeof DistributedLockSchema>
