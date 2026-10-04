/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/usecase.md
 */
import { ICacheAdapter } from '@/infra/cache'
import { ITokenAdapter } from '@/libs/token'
import { ValidateSchema } from '@/utils/decorators'
import { Namespaces } from '@/utils/namespaces'
import { ObjectUtils } from '@/utils/object'
import { ApiTracingInput } from '@/utils/request'
import { IUsecase } from '@/utils/usecase'
import { InputValidator, SchemaInfer } from '@/utils/validator'

export const LogoutSchema = InputValidator.object({ token: InputValidator.string().trim().min(10) })

export class LogoutUsecase implements IUsecase {
  constructor(
    private readonly redis: ICacheAdapter,
    private readonly tokenService: ITokenAdapter
  ) {}

  @ValidateSchema(LogoutSchema)
  async execute(input: LogoutInput, { tracing, user }: ApiTracingInput): LogoutOutput {
    const decoded = this.tokenService.decode<{ exp?: number }>({ token: input.token })

    const exp = ObjectUtils.reach(decoded, (d) => d.exp)

    if (!exp) {
      return
    }

    const ttl = exp * 1000 - Date.now()

    if (ttl <= 0) {
      return
    }

    const key = Namespaces.blacklist(user.id)

    await this.redis.set(key, input.token, { PX: ttl })

    tracing.logEvent('user-logout', { action: 'logout', by: user.id })
  }
}

export type LogoutInput = SchemaInfer<typeof LogoutSchema>
export type LogoutOutput = Promise<void>
