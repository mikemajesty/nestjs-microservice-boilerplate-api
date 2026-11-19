/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/test.md
 */
import { Test } from '@nestjs/testing'

import { ISessionAdapter } from '@/libs/session'
import { ILogout } from '@/modules/logout/interfaces'
import { MockUtils, TestUtils } from '@/utils/test'

import { LogoutUsecase } from '../user-logout'

describe(LogoutUsecase.name, () => {
  let usecase: ILogout
  let session: ISessionAdapter

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        TestUtils.mockProvider(ISessionAdapter, { revoke: TestUtils.mockResolvedValue() }),
        {
          provide: ILogout,
          useFactory: (session: ISessionAdapter) => {
            return new LogoutUsecase(session)
          },
          inject: [ISessionAdapter]
        }
      ]
    }).compile()

    usecase = app.get(ILogout)
    session = app.get(ISessionAdapter)
  })

  test('when user logout, should revoke only the session of the current token', async () => {
    const trace = MockUtils.Tracing()

    await expect(usecase.execute(trace)).resolves.toBeUndefined()
    expect(session.revoke).toHaveBeenCalledWith({ userId: trace.user.id, sessionId: trace.user.sid })
    expect(session.revoke).toHaveBeenCalledTimes(1)
  })
})
