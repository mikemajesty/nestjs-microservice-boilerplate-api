/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/utils/axios.md
 */
import { AxiosError, AxiosInstance } from 'axios'
import axiosRetry from 'axios-retry'
import { AxiosConverter } from 'nestjs-convert-to-curl'

import { ILoggerAdapter } from '@/infra/logger'

import { ApiInternalServerException } from './exception'
import { DEFAULT_RETRY_STATUS, DefaultErrorMessage, NETWORK_RETRY_CODES } from './http-status'
import { ObjectUtils } from './object'
import { getCurrentDeadline } from './request/deadline'
import { TimeoutBudget } from './request/timeout-budget'

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
      ObjectUtils.reach(error, (e) => e.response.status),
      ObjectUtils.reach(error, (e) => e.status),
      ObjectUtils.reach(error, (e) => e.response.data.code),
      ObjectUtils.reach(error, (e) => e.response.data.error.code),
      ApiInternalServerException.STATUS
    ]

    const status = statusCandidates
      .map((candidate) => Number(candidate))
      .find((candidate) => Number.isInteger(candidate) && candidate >= 100 && candidate <= 599)

    return status ?? ApiInternalServerException.STATUS
  }

  private static extractErrorMessage(error: CustomAxiosError): string {
    const messageCandidates = [
      ObjectUtils.reach(error, (e) => e.response.data.description),
      ObjectUtils.reach(error, (e) => e.response.data.error.message),
      ObjectUtils.reach(error, (e) => e.response.data.message),
      ObjectUtils.reach(error, (e) => e.response.statusText),
      ObjectUtils.reach(error, (e) => e.message),
      DefaultErrorMessage[ApiInternalServerException.STATUS]
    ]

    return messageCandidates.find(Boolean) as string
  }

  static requestRetry = ({ axios, logger, status: statusRetry = DEFAULT_RETRY_STATUS }: RequestRetry): void => {
    axiosRetry(axios, {
      shouldResetTimeout: true,
      retries: 0,
      retryBudgetMs: TimeoutBudget.DEPENDENCY_TIMEOUT_MS,

      retryDelay: (retryCount: number, error: AxiosError | CustomAxiosError) => {
        const axiosError = error as CustomAxiosError
        const statusText = ObjectUtils.reach(axiosError, (e) => e.response.data.message)

        const status = this.extractErrorStatus(axiosError)

        logger.warn({
          message: `Retrying request: attempt ${retryCount}`,
          metadata: {
            statusText: statusText ?? error.message,
            status,
            url: error.config?.url,
            method: error.config?.method?.toUpperCase()
          }
        })

        return this.getRetryDelay(retryCount)
      },

      retryCondition: (error: AxiosError | CustomAxiosError) => {
        const status = this.extractErrorStatus(error as CustomAxiosError)
        const retryConfig = error.config?.['axios-retry']
        const requestRetryStatus = retryConfig?.status

        const isNetworkError = NETWORK_RETRY_CODES.includes(error.code as string)
        const isRetryableStatus = (requestRetryStatus ?? statusRetry).includes(status)

        if (!isNetworkError && !isRetryableStatus) {
          return false
        }

        return this.canScheduleRetry(error, logger)
      },

      onRetry: (retryCount, error, requestConfig) => {
        logger.warn({
          message: `Retry scheduled: attempt ${retryCount}`,
          metadata: {
            url: requestConfig.url,
            method: requestConfig.method,
            status: this.extractErrorStatus(error as CustomAxiosError)
          }
        })
      },

      onMaxRetryTimesExceeded: (error, retryCount) => {
        logger.warn({
          message: `All retry attempts failed after ${retryCount} retries`,
          metadata: {
            url: error.config?.url,
            method: error.config?.method,
            status: this.extractErrorStatus(error as CustomAxiosError)
          }
        })
      }
    })
  }

  private static getRetryDelay = (retryCount: number): number => {
    return Math.random() * this.getRetryDelayMaximum(retryCount)
  }

  private static getRetryDelayMaximum = (retryCount: number): number => {
    return 2 ** retryCount * 1000
  }

  private static canScheduleRetry = (error: AxiosError | CustomAxiosError, logger: ILoggerAdapter): boolean => {
    const retryConfig = error.config?.['axios-retry']
    const deadlineAwareBudget = TimeoutBudget.getDependencyTimeoutMs(getCurrentDeadline())

    const getRetryBudget = () => {
      if (retryConfig?.retryBudgetMs !== undefined) {
        return Math.min(retryConfig.retryBudgetMs, deadlineAwareBudget)
      }
      return deadlineAwareBudget
    }

    const retryBudget = getRetryBudget()
    const elapsed = retryConfig?.lastRequestTime ? Date.now() - retryConfig.lastRequestTime : undefined

    if (elapsed === undefined) {
      return true
    }

    const retryCount = retryConfig?.retryCount ?? 0
    const maximumNextDelay = this.getRetryDelayMaximum(retryCount + 1)

    const hasSufficientRetryBudget = elapsed + maximumNextDelay < retryBudget

    if (hasSufficientRetryBudget) {
      return true
    }

    logger.warn({
      message: 'Retry budget exhausted',
      metadata: {
        elapsed,
        maximumNextDelay,
        retryBudget,
        url: error.config?.url,
        method: error.config?.method
      }
    })

    return false
  }
}

export class CustomAxiosError extends AxiosError<AdditionalAxiosErrorData> {
  data!: {
    message?: string
    code?: number | string
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
