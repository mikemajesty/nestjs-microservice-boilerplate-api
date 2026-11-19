/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/usecase.md
 */
import { ISessionAdapter } from '@/libs/session'
import { ApiTracingInput } from '@/utils/request'
import { IUsecase } from '@/utils/usecase'

export class LogoutUsecase implements IUsecase {
  constructor(private readonly session: ISessionAdapter) {}

  /**
   * Ends the session of the access token used in this request. Its access and refresh
   * tokens stop working immediately; other sessions of the same user are not affected.
   */
  async execute({ tracing, user }: ApiTracingInput): LogoutOutput {
    await this.session.revoke({ userId: user.id, sessionId: user.sid })

    tracing.logEvent('user-logout', { action: 'logout', by: user.id })
  }
}

export type LogoutOutput = Promise<void>
