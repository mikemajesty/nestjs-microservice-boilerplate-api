import { TestUtils } from '@/utils/tests';

jest.setTimeout(5000);

jest.mock('pino-http', () => ({
  HttpLogger: {},
  pinoHttp: () => ({
    logger: {
      info: TestUtils.mockReturnValue<void>(),
      error: TestUtils.mockReturnValue<void>()
    }
  })
}));

jest.mock('pino', () => jest.genMockFromModule('pino'));
