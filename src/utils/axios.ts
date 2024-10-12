import { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { AxiosConverter } from 'nestjs-convert-to-curl';

import { ILoggerAdapter } from '@/infra/logger';

export const interceptAxiosResponseError = (error) => {
  error.stack = error.stack.replace(
    /AxiosError.*node:internal\/process\/task_queues:[0-9]+:[0-9]+\).*axiosBetterStacktrace.ts:[0-9]+:[0-9]+\)/g,
    ''
  );

  const status = [error?.response?.data?.code, error?.response?.data?.error?.code, error?.response?.status, 500].find(
    Boolean
  );

  const message = [
    error?.response?.data?.description,
    error?.response?.data?.error?.message,
    error?.response?.statusText,
    'Internal Server Error'
  ].find(Boolean);

  error.message = message;

  error.status = status;
  error.curl = AxiosConverter.getCurl(error, ['password', 'cpf']);
};

type RequestRetry = {
  status?: number[];
  logger: ILoggerAdapter;
  axios: AxiosInstance;
};

export const requestRetry = ({ axios, logger, status: statusRetry = [503, 422, 408] }: RequestRetry) => {
  axiosRetry(axios, {
    shouldResetTimeout: true,
    retryDelay: (retryCount, axiosError) => {
      logger.warn({
        message: `retry attempt: ${retryCount}`,
        obj: {
          statusText: [axiosError.response?.data['message'], axiosError.message].find(Boolean),
          status: [
            axiosError.response?.status,
            axiosError.status,
            axiosError.response?.data['status'],
            axiosError?.response?.data['code'],
            axiosError.code
          ].find(Boolean),
          url: axiosError.config.url
        }
      });
      return retryCount * 2000;
    },
    retryCondition: (error) => {
      if (error?.code === 'ECONNABORTED' || error?.code === 'ECONNRESET') {
        error.status = 408;
      }

      const status = [error?.response?.status, error?.status, 500].find(Boolean);
      return statusRetry.includes(status);
    }
  });
};
