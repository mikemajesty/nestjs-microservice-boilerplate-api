import { AxiosConverter } from 'nestjs-convert-to-curl';

import { ILoggerAdapter } from '@/infra/logger';

import { BaseException } from './exception';

export const interceptAxiosResponseError = (error, logger: ILoggerAdapter) => {
  error.stack = error.stack.replace(
    /AxiosError.*node:internal\/process\/task_queues:[0-9]+:[0-9]+\).*axiosBetterStacktrace.ts:[0-9]+:[0-9]+\)/g,
    ''
  );
  const status = [error.response.data?.code, error.response.data?.error?.code, error.response?.status, 500].find(
    Boolean
  );
  const message = [
    error.response.data?.description,
    error.response.data?.error?.message,
    error.response?.statusText,
    'Internal Server Error'
  ].find(Boolean);

  const curl = AxiosConverter.getCurl(error);
  logger.error(new BaseException(message, status, { curl, responseData: error.response.data }));
};
