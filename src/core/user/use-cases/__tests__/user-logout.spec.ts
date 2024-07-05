import { Test } from '@nestjs/testing';

import { ICacheAdapter } from '@/infra/cache';
import { ISecretsAdapter, SecretsModule } from '@/infra/secrets';
import { TokenLibModule } from '@/libs/token';
import { ILogoutAdapter } from '@/modules/logout/adapter';
import { expectZodError, getMockTracing } from '@/utils/tests';

import { LogoutUsecase } from '../user-logout';

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
            set: jest.fn()
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
    await expectZodError(
      () => usecase.execute({}, getMockTracing()),
      (issues) => {
        expect(issues).toEqual([{ message: 'Required', path: 'token' }]);
      }
    );
  });

  test('when user logout, should expect set token to blacklist', async () => {
    cache.set = jest.fn();

    await expect(usecase.execute({ token: '12345678910' }, getMockTracing())).resolves.toBeUndefined();
  });
});
