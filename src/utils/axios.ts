/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/utils/axios.md
 */
import { AxiosError, AxiosInstance } from 'axios'
import axiosRetry from 'axios-retry'
import { AxiosConverter } from 'nestjs-convert-to-curl'

import { ILoggerAdapter } from '@/infra/logger'

import { ApiInternalServerException } from './exception'
import { DefaultErrorMessage } from './http-status'
import { ObjectUtil } from './object'

export class AxiosUtils {
  static interceptAxiosResponseError = (error: CustomAxiosError): void => {
    if (error.stack) {
      error.stack = error.stack.replace(
        /AxiosError.*node:internal\/process\/task_queues:\d+:\d+\).*axiosBetterStacktrace\.ts:\d+:\d+\)/g,
        ''
      )
    }

    const status = this.extractErrorStatus(error)

    const message = this.extractErrorMessage(error)

    Object.assign(error, {
      message,
      status,
      curl: AxiosConverter.getCurl(error, ['password', 'cpf', 'authorization', 'token'])
    })
  }

  private static extractErrorStatus(error: CustomAxiosError): number {
    const statusCandidates = [
      ObjectUtil.reach(error, (e) => e.response.data.code),
      ObjectUtil.reach(error, (e) => e.response.data.error.code),
      ObjectUtil.reach(error, (e) => e.response.status),
      ObjectUtil.reach(error, (e) => e.status),
      500
    ]

    const status = statusCandidates.find(
      (candidate): candidate is number => candidate !== undefined && candidate !== null && candidate !== ''
    )

    return Number(status)
  }

  private static extractErrorMessage(error: CustomAxiosError): string {
    const messageCandidates = [
      ObjectUtil.reach(error, (e) => e.response.data.description),
      ObjectUtil.reach(error, (e) => e.response.data.error.message),
      ObjectUtil.reach(error, (e) => e.response.data.message),
      ObjectUtil.reach(error, (e) => e.response.statusText),
      ObjectUtil.reach(error, (e) => e.message),
      DefaultErrorMessage[ApiInternalServerException.STATUS]
    ]

    return messageCandidates.find(Boolean) as string
  }

  static requestRetry = ({ axios, logger, status: statusRetry = [503, 422, 408, 429] }: RequestRetry): void => {
    axiosRetry(axios, {
      shouldResetTimeout: true,
      retries: 3,

      retryDelay: (retryCount: number, error: AxiosError | CustomAxiosError) => {
        const axiosError = error as CustomAxiosError
        const statusText = ObjectUtil.reach(axiosError, (e) => e.response.data.message)

        const status = this.extractErrorStatus(axiosError)

        logger.warn({
          message: `Retry attempt: ${retryCount}`,
          obj: {
            statusText: statusText ?? error.message,
            status,
            url: error.config?.url,
            method: error.config?.method?.toUpperCase()
          }
        })

        const baseDelay = Math.pow(2, retryCount) * 1000
        const jitter = Math.random() * 1000
        return baseDelay + jitter
      },

      retryCondition: (error: AxiosError | CustomAxiosError) => {
        const status = this.extractErrorStatus(error as CustomAxiosError)

        const isNetworkError = ['ECONNABORTED', 'ECONNRESET', 'ETIMEDOUT'].includes(error.code as string)
        const isRetryableStatus = statusRetry.includes(status)
        const isServerError = status >= 500 && status < 600

        return isNetworkError || isRetryableStatus || isServerError
      },

      onRetry: (retryCount, error, requestConfig) => {
        logger.warn({
          message: `All retry attempts failed after ${retryCount} retries`,
          obj: {
            url: requestConfig.url,
            method: requestConfig.method,
            status: this.extractErrorStatus(error as CustomAxiosError)
          }
        })
      }
    })
  }
}

type RequestRetry = {
  status?: number[]
  logger: ILoggerAdapter
  axios: AxiosInstance
}

type AdditionalAxiosErrorData = {
  description?: string
  error?: {
    message?: string
    code?: number | string
  }
  code?: number | string
  message?: string
  status?: number
}

export class CustomAxiosError extends AxiosError<AdditionalAxiosErrorData> {
  data!: {
    message?: string
    code?: number | string
  }
}
