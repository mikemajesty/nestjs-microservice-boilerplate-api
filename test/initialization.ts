jest.setTimeout(5000);

jest.mock('pino-http', () => ({
  HttpLogger: {},
  pinoHttp: () => ({
    logger: {
      info: jest.fn(),
      error: jest.fn()
    }
  })
}));

jest.mock('pino', () => jest.genMockFromModule('pino'));
