/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/tests/README.md
 */
import { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'
import { CACHE_SERVICE, CachePlugin, ICacheService } from '@nestjs-redisx/cache'
import { RedisTestingModule } from '@nestjs-redisx/testing'

import { IUserRepository } from '@/core/user/repository/user'
import { ICacheAdapter, USER_PERMISSIONS_CACHE_TAG, userCacheTag } from '@/infra/cache'
import { ITokenAdapter } from '@/libs/token'
import { PUBLIC_GUARD } from '@/utils/decorators'
import { TestUtils } from '@/utils/test/utils'

import { AuthorizationRoleGuard } from '../authorization.guard'

const USER_ID = '9e9b7f7d-2a1d-4a9a-9f1f-4a2b7d6b1c11'
const PERMISSION = 'user:update'

const getContext = (): ExecutionContext =>
  ({
    getHandler: () => jest.fn(),
    getClass: () => AuthorizationRoleGuard,
    switchToHttp: () => ({
      getRequest: () => ({ headers: { authorization: 'Bearer token' }, id: 'trace-id' })
    })
  }) as unknown as ExecutionContext

describe(AuthorizationRoleGuard.name, () => {
  let guard: AuthorizationRoleGuard
  let userRepository: IUserRepository
  let cacheService: ICacheService
  let app: TestingModule

  beforeEach(async () => {
    app = await Test.createTestingModule({
      imports: [RedisTestingModule.forRoot({ plugins: [new CachePlugin()] })],
      providers: [
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: (key: string) => (key === PUBLIC_GUARD ? false : PERMISSION),
            get: TestUtils.mockReturnValue<string>(PERMISSION)
          }
        },
        {
          provide: IUserRepository,
          useValue: {
            findOneWithRelation: jest.fn().mockResolvedValue({
              id: USER_ID,
              roles: [{ permissions: [{ name: PERMISSION }] }]
            })
          }
        },
        { provide: ITokenAdapter, useValue: { verify: TestUtils.mockResolvedValue<object>({ id: USER_ID }) } },
        { provide: ICacheAdapter, useValue: { get: TestUtils.mockResolvedValue<null>(null) } },
        {
          provide: AuthorizationRoleGuard,
          useFactory: (reflector: Reflector, repository: IUserRepository, token: ITokenAdapter, cache: ICacheAdapter) =>
            new AuthorizationRoleGuard(reflector, repository, token, cache),
          inject: [Reflector, IUserRepository, ITokenAdapter, ICacheAdapter]
        }
      ]
    }).compile()

    await app.init()

    guard = app.get(AuthorizationRoleGuard)
    userRepository = app.get(IUserRepository)
    cacheService = app.get<ICacheService>(CACHE_SERVICE)
    await cacheService.clear()
  })

  afterEach(async () => {
    await app.close()
  })

  test('when permissions were already resolved, should not query the database again', async () => {
    await expect(guard.canActivate(getContext())).resolves.toBeTruthy()
    await expect(guard.canActivate(getContext())).resolves.toBeTruthy()

    expect(userRepository.findOneWithRelation).toHaveBeenCalledTimes(1)
  })

  test('when the user changes, should drop the cached permissions', async () => {
    await guard.canActivate(getContext())
    await cacheService.invalidateTags([userCacheTag(USER_ID)])
    await guard.canActivate(getContext())

    expect(userRepository.findOneWithRelation).toHaveBeenCalledTimes(2)
  })

  test('when roles or permissions change, should drop every cached permission set', async () => {
    await guard.canActivate(getContext())
    await cacheService.invalidateTags([USER_PERMISSIONS_CACHE_TAG])
    await guard.canActivate(getContext())

    expect(userRepository.findOneWithRelation).toHaveBeenCalledTimes(2)
  })
})
