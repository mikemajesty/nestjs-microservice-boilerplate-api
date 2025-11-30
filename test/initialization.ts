jest.setTimeout(30000);

process.env.NODE_ENV = 'test';
process.env.TOKEN_TEST =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQGFkbWluLmNvbSIsIm5hbWUiOiJBZG1pbiIsImlkIjoiZGYwMzJmMTktZmM0Yy00NDA5LTlhYTktMzMyNjRkMmM3YjcxIiwiaWF0IjoxNzM4MjU3NjI0LCJleHAiOjE3Njk3OTM2MjR9.j0pvqjU3Z_BICTo5wFLrkLo7jTvjW6SWbHcGbJ5T6mQ';

jest.mock('pino-http', () => ({
  HttpLogger: {},
  pinoHttp: () => ({
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
      fatal: jest.fn()
    }
  })
}));

jest.mock('pino', () => jest.createMockFromModule('pino'));
