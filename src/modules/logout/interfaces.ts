/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/adapter.md
 */
import { LogoutInput, LogoutOutput } from '@/core/user/use-cases/user-logout'
import { ApiTracingInput } from '@/utils/request'
import { IUsecase } from '@/utils/usecase'

export abstract class ILogout implements IUsecase {
  abstract execute(input: LogoutInput, trace: ApiTracingInput): Promise<LogoutOutput>
}
