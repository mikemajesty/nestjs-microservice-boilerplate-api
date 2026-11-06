/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/infra/distributed-lock.md
 */
import { Injectable } from '@nestjs/common'

import { ValidateSchema } from '@/utils/decorators'
import { ApiInternalServerException } from '@/utils/exception'
import { IDGeneratorUtils } from '@/utils/id-generator'
import { InputValidator, SchemaInfer } from '@/utils/validator'

import { ICacheAdapter } from '../cache'
import { IDistributedLockAdapter } from './adapter'

const DistributedLockSchema = InputValidator.object({
  key: InputValidator.string().trim().min(1),
  ttlSeconds: InputValidator.number().int().positive()
})

const ACQUIRE_LOCK_SCRIPT = `
  if redis.call("exists", KEYS[1]) == 1 then
    return nil
  end

  redis.call("incr", KEYS[2])
  local fencingToken = redis.call("get", KEYS[2])
  redis.call("set", KEYS[1], ARGV[1], "EX", ARGV[2])
  return fencingToken
`

const RELEASE_LOCK_SCRIPT = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
  else
    return 0
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
    const { lockKey, fencingCounterKey } = this.buildLockKeys(key)
    const ownerToken = IDGeneratorUtils.generate('uuid')

    const fencingToken = await this.acquire(lockKey, fencingCounterKey, ownerToken, ttlSeconds)
    if (fencingToken === null) return null

    return {
      fencingToken,
      release: async () => {
        await this.release(lockKey, ownerToken)
      }
    }
  }

  private buildLockKeys(key: string): { lockKey: string; fencingCounterKey: string } {
    const keyHash = Buffer.from(key).toString('base64url')
    const hashTag = `{${keyHash}}`

    return {
      lockKey: `${this.lockPrefix}:${hashTag}:lock`,
      fencingCounterKey: `${this.lockPrefix}:${hashTag}:fence`
    }
  }

  private async acquire(
    lockKey: string,
    fencingCounterKey: string,
    ownerToken: string,
    ttlSeconds: number
  ): Promise<string | null> {
    const result = await this.cache.client.eval(
      ACQUIRE_LOCK_SCRIPT,
      2,
      lockKey,
      fencingCounterKey,
      ownerToken,
      ttlSeconds
    )

    if (result === null) return null

    if (typeof result !== 'string') {
      throw new ApiInternalServerException('Redis returned an invalid distributed lock fencing token', {
        context: `${DistributedLockService.name}.acquire`,
        details: [`Expected a decimal string, received ${typeof result}`],
        metadata: { lockKey, fencingCounterKey }
      })
    }

    return result
  }

  private async release(lockKey: string, ownerToken: string): Promise<void> {
    await this.cache.client.eval(RELEASE_LOCK_SCRIPT, 1, lockKey, ownerToken)
  }
}

export type DistributedLockGetInput = SchemaInfer<typeof DistributedLockSchema>
export type DistributedLockGetOutput = DistributedLockGetInput

export type DistributedLockReleaseLockFn = () => Promise<void>

export type DistributedLockAcquired = {
  /** Decimal string from Redis INCR; retain its full 64-bit integer precision. */
  fencingToken: string
  release: DistributedLockReleaseLockFn
}

export type DistributedLockTryAcquireLockOutput = DistributedLockAcquired | null
export type DistributedLockTryAcquireLockInput = SchemaInfer<typeof DistributedLockSchema>
