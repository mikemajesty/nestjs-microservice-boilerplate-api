import { Test, TestingModule } from '@nestjs/testing';

import { II18nAdapter } from '@/libs/i18n';

import { name, version } from '../../../../package.json';
import { HealthController } from '../controller';

describe('HealthController', () => {
  let healthController: HealthController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: II18nAdapter,
          useValue: {
            translate: () => 'Hello'
          }
        }
      ]
    }).compile();

    healthController = app.get<HealthController>(HealthController);
  });

  it('should return "Hello World!"', async () => {
    expect(await healthController.getHealth()).toBe(`${name}:${version} available!`);
  });
});
