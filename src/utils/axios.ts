import { AxiosError, AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { AxiosConverter } from 'nestjs-convert-to-curl';

import { ILoggerAdapter } from '@/infra/logger';

export class AxiosUtils {
  static interceptAxiosResponseError = (error: CustomAxiosError): void => {
    if (error.stack) {
      error.stack = error.stack.replace(
        /AxiosError.*node:internal\/process\/task_queues:\d+:\d+\).*axiosBetterStacktrace\.ts:\d+:\d+\)/g,
        ''
      );
    }

    const status = this.extractErrorStatus(error);

    const message = this.extractErrorMessage(error);

    Object.assign(error, {
      message,
      status,
      curl: AxiosConverter.getCurl(error, ['password', 'cpf', 'authorization', 'token'])
    });
  };

  private static extractErrorStatus(error: CustomAxiosError): number {
    const statusCandidates = [
      error.response?.data?.code,
      error.response?.data?.error?.code,
      error.response?.status,
      error.status,
      500
    ];

    const status = statusCandidates.find(
      (candidate): candidate is number => candidate !== undefined && candidate !== null && candidate !== ''
    );

    return Number(status);
  }

  private static extractErrorMessage(error: CustomAxiosError): string {
    const messageCandidates = [
      error.response?.data?.description,
      error.response?.data?.error?.message,
      error.response?.data?.message,
      error.response?.statusText,
      error.message,
      'Internal Server Error'
    ];

    return messageCandidates.find(Boolean) as string;
  }

  static requestRetry = ({ axios, logger, status: statusRetry = [503, 422, 408, 429] }: RequestRetry): void => {
    axiosRetry(axios, {
      shouldResetTimeout: true,
      retries: 3,

      retryDelay: (retryCount: number, error: AxiosError | CustomAxiosError) => {
        const statusText = [(error.response?.data as CustomAxiosError)?.message, error.message].find(Boolean);

        const status = this.extractErrorStatus(error as CustomAxiosError);

        logger.warn({
          message: `Retry attempt: ${retryCount}`,
          obj: {
            statusText,
            status,
            url: error.config?.url,
            method: error.config?.method?.toUpperCase()
          }
        });

        const baseDelay = Math.pow(2, retryCount) * 1000;
        const jitter = Math.random() * 1000;
        return baseDelay + jitter;
      },

      retryCondition: (error: AxiosError | CustomAxiosError) => {
        const status = this.extractErrorStatus(error as CustomAxiosError);

        const isNetworkError = ['ECONNABORTED', 'ECONNRESET', 'ETIMEDOUT'].includes(error.code as string);
        const isRetryableStatus = statusRetry.includes(status);
        const isServerError = status >= 500 && status < 600;

        return isNetworkError || isRetryableStatus || isServerError;
      },

      onRetry: (retryCount, error, requestConfig) => {
        logger.warn({
          message: `All retry attempts failed after ${retryCount} retries`,
          obj: {
            url: requestConfig.url,
            method: requestConfig.method,
            status: this.extractErrorStatus(error as CustomAxiosError)
          }
        });
      }
    });
  };
}

type RequestRetry = {
  status?: number[];
  logger: ILoggerAdapter;
  axios: AxiosInstance;
};

type AdditionalAxiosErrorData = {
  description?: string;
  error?: {
    message?: string;
    code?: number | string;
  };
  code?: number | string;
  message?: string;
  status?: number;
};

export class CustomAxiosError extends AxiosError<AdditionalAxiosErrorData> {
  data!: {
    message?: string;
    code?: number | string;
  };
}
