import { Test } from '@nestjs/testing';

import { ICacheAdapter } from '@/infra/cache';
import { ISecretsAdapter, SecretsModule } from '@/infra/secrets';
import { TokenModule } from '@/libs/auth';
import { ILogoutAdapter } from '@/modules/logout/adapter';
import { expectZodError } from '@/utils/tests';

import { LogoutUsecase } from '../user-logout';

describe('LogoutUsecase', () => {
  let usecase: ILogoutAdapter;
  let cache: ICacheAdapter;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [TokenModule, SecretsModule],
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

  test('should throw error when invalid parameters', async () => {
    await expectZodError(
      () => usecase.execute({}),
      (issues) => {
        expect(issues).toEqual([{ message: 'Required', path: 'token' }]);
      }
    );
  });

  test('should logout successfully', async () => {
    cache.set = jest.fn();
    await expect(usecase.execute({ token: '12345678910' })).resolves.toBeUndefined();
  });
});
