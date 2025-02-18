import { Test } from '@nestjs/testing';
import { TestMock } from 'test/mock';
import { ZodIssue } from 'zod';

import { ICacheAdapter } from '@/infra/cache';
import { ISecretsAdapter, SecretsModule } from '@/infra/secrets';
import { TokenLibModule } from '@/libs/token';
import { ILogoutAdapter } from '@/modules/logout/adapter';

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
            set: TestMock.mockResolvedValue<void>()
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
    await TestMock.expectZodError(
      () => usecase.execute({} as LogoutInput, TestMock.getMockTracing()),
      (issues: ZodIssue[]) => {
        expect(issues).toEqual([{ message: 'Required', path: TestMock.nameOf<LogoutInput>('token') }]);
      }
    );
  });

  test('when user logout, should expect set token to blacklist', async () => {
    cache.set = TestMock.mockResolvedValue<void>();

    await expect(usecase.execute({ token: '12345678910' }, TestMock.getMockTracing())).resolves.toBeUndefined();
  });
});
