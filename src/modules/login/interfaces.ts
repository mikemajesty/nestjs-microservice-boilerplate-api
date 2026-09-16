/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/adapter.md
 */
import { LoginInput, LoginOutput } from '@/core/user/use-cases/user-login'
import { RefreshTokenInput, RefreshTokenOutput } from '@/core/user/use-cases/user-refresh-token'
import { ApiTracingInput } from '@/utils/request'
import { IUsecase } from '@/utils/usecase'

export abstract class ILogin implements IUsecase {
  abstract execute(input: LoginInput, trace: ApiTracingInput): Promise<LoginOutput>
}

export abstract class IRefreshToken implements IUsecase {
  abstract execute(input: RefreshTokenInput): Promise<RefreshTokenOutput>
}
