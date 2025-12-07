import { Test } from '@nestjs/testing';

import { ICacheAdapter } from '@/infra/cache';
import { ISecretsAdapter, SecretsModule } from '@/infra/secrets';
import { TokenLibModule } from '@/libs/token';
import { ILogoutAdapter } from '@/modules/logout/adapter';
import { TestUtils } from '@/utils/test/util';
import { ZodExceptionIssue } from '@/utils/validator';

import { LogoutInput, LogoutUsecase } from '../user-logout';

describe(LogoutUsecase.name, () => {
  let usecase: ILogoutAdapter;
  let cache: ICacheAdapter;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [TokenLibModule, SecretsModule],
      providers: [
        {
          provide: ICacheAdapter,
          useValue: {
            set: TestUtils.mockResolvedValue<void>()
          }
        },
        {
          provide: ILogoutAdapter,
          useFactory: (cache: ICacheAdapter, secrets: ISecretsAdapter) => {
            return new LogoutUsecase(cache, secrets);
          },
          inject: [ICacheAdapter, ISecretsAdapter]
        }
      ]
    }).compile();

    usecase = app.get(ILogoutAdapter);
    cache = app.get(ICacheAdapter);
  });

  test('when no input is specified, should expect an error', async () => {
    await TestUtils.expectZodError(
      () => usecase.execute({} as LogoutInput, TestUtils.getMockTracing()),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          {
            message: 'Invalid input: expected string, received undefined',
            path: TestUtils.nameOf<LogoutInput>('token')
          }
        ]);
      }
    );
  });

  test('when user logout, should expect set token to blacklist', async () => {
    cache.set = TestUtils.mockResolvedValue<void>();

    await expect(usecase.execute({ token: '12345678910' }, TestUtils.getMockTracing())).resolves.toBeUndefined();
  });
});
