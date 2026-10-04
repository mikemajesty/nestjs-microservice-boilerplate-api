/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/test.md
 */
import { Test } from '@nestjs/testing'

import { ICacheAdapter } from '@/infra/cache'
import { ITokenAdapter } from '@/libs/token'
import { ILogout } from '@/modules/logout/interfaces'
import { MockUtils, TestUtils } from '@/utils/test'
import { ZodExceptionIssue } from '@/utils/validator'

import { LogoutInput, LogoutUsecase } from '../user-logout'

describe(LogoutUsecase.name, () => {
  let usecase: ILogout
  let token: ITokenAdapter

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [],
      providers: [
        TestUtils.mockProvider(ICacheAdapter, {
          set: TestUtils.mockResolvedValue()
        }),
        TestUtils.mockProvider(ITokenAdapter),
        {
          provide: ILogout,
          useFactory: (cache: ICacheAdapter, token: ITokenAdapter) => {
            return new LogoutUsecase(cache, token)
          },
          inject: [ICacheAdapter, ITokenAdapter]
        }
      ]
    }).compile()

    usecase = app.get(ILogout)
    token = app.get(ITokenAdapter)
  })

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as LogoutInput, MockUtils.Tracing()),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<LogoutInput>('token')
          }
        ])
      }
    )
  })

  test('when decode is missing, should ignore logout', async () => {
    token.decode = TestUtils.mockImplementation(() => null)

    await expect(usecase.execute({ token: '12345678910' }, MockUtils.Tracing())).resolves.toBeUndefined()
  })

  test('when token already expired, should ignore logout', async () => {
    token.decode = TestUtils.mockImplementation<() => { exp: number }>(() => ({ exp: Date.now() / 1000 - 60 }))

    await expect(usecase.execute({ token: '12345678910' }, MockUtils.Tracing())).resolves.toBeUndefined()
  })

  test('when user logout, should expect set token to blacklist', async () => {
    token.decode = TestUtils.mockImplementation<() => { exp: number }>(() => ({ exp: Date.now() / 1000 + 60 }))

    await expect(usecase.execute({ token: '12345678910' }, MockUtils.Tracing())).resolves.toBeUndefined()
  })
})
