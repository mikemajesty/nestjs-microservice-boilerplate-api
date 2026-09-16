import { SchemaInfer } from '@/utils/validator'

import { CacheMemorySetConfigInput } from './memory'
import { CacheRedisSetConfigInput, CacheSetNXInputSchema } from './redis'

export type CacheKeyArgument = string | Buffer
export type CacheValueArgument = string | Buffer

export type CacheKeyValue = {
  key: CacheKeyArgument
  value: CacheValueArgument | CacheValueArgument[]
}

export type CacheSetNXInput = SchemaInfer<typeof CacheSetNXInputSchema>

export type CacheEvalInput = {
  script: string
  keys: string[]
  args: (string | Buffer | number)[]
}

export type CacheSetConfigInput = CacheRedisSetConfigInput | CacheMemorySetConfigInput
