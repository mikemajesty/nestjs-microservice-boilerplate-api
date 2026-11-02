/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/utils/axios.md
 */
import { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import axiosRetry, { IAxiosRetryConfigExtended } from 'axios-retry'
import { AxiosConverter } from 'nestjs-convert-to-curl'

import { ILoggerAdapter } from '@/infra/logger'

import { ApiInternalServerException } from './exception'
import { DEFAULT_RETRY_STATUS, DefaultErrorMessage, NETWORK_RETRY_CODES } from './http-status'
import { ObjectUtils } from './object'
import { getCurrentDeadline } from './request/deadline'
import { TimeoutBudget } from './request/timeout-budget'

const RESPONSE_SIZE_EXCEEDED_REGEX = /maxContentLength size of -?\d+ exceeded/

const REQUEST_SIZE_EXCEEDED_REGEX = /Request body larger than maxBodyLength limit/

export type PayloadLimit = 'request' | 'response'

const SENSITIVE_CURL_DATA = {
  body: ['password', 'cpf', 'authorization', 'token'],
  headers: ['authorization', 'proxy-authorization', 'cookie', 'x-api-key'],
  query: ['token', 'access_token', 'api_key']
}

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
      curl: AxiosConverter.getCurl(error, SENSITIVE_CURL_DATA)
    })
  }

  // Axios reuses ERR_BAD_RESPONSE/ERR_BAD_REQUEST (also used for real 5xx/4xx) for size
  // limits, so the message is the only reliable discriminator.
  static getPayloadLimitExceeded = (error: { message: string; response?: unknown }): PayloadLimit | undefined => {
    if (error.response) return undefined

    if (RESPONSE_SIZE_EXCEEDED_REGEX.test(error.message)) return 'response'
    if (REQUEST_SIZE_EXCEEDED_REGEX.test(error.message)) return 'request'

    return undefined
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

        // Same delay already validated against the budget in `canScheduleRetry`.
        const scheduledDelay = axiosError.config?.['axios-retry']?.nextRetryDelayMs

        return scheduledDelay ?? this.getRetryDelay(retryCount)
      },

      retryCondition: (error: AxiosError | CustomAxiosError) => {
        // The payload would be just as big on the next attempt.
        if (this.getPayloadLimitExceeded(error)) {
          return false
        }

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

    // Must be registered after axios-retry: Axios runs request interceptors in reverse order,
    // so this runs first and axios-retry keeps the extra fields when it rebuilds its state.
    axios.interceptors.request.use((config) => this.trackRetryOperation(config))
  }

  private static trackRetryOperation = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const retryConfig = config['axios-retry']

    if (!retryConfig?.retryCount) {
      config['axios-retry'] = { ...retryConfig, operationStartedAt: Date.now() }
      return config
    }

    const remainingBudget = Math.max(1, this.getRemainingRetryBudgetMs(retryConfig))
    config.timeout = config.timeout ? Math.min(config.timeout, remainingBudget) : remainingBudget

    return config
  }

  private static getRemainingRetryBudgetMs = (retryConfig: IAxiosRetryConfigExtended | undefined): number => {
    const now = Date.now()
    const configuredBudget = Math.min(
      retryConfig?.retryBudgetMs ?? TimeoutBudget.DEPENDENCY_TIMEOUT_MS,
      TimeoutBudget.DEPENDENCY_TIMEOUT_MS
    )
    const elapsed = now - (retryConfig?.operationStartedAt ?? now)
    const remainingBudget = configuredBudget - elapsed
    const deadline = getCurrentDeadline()

    return deadline ? Math.min(remainingBudget, deadline.remainingMs()) : remainingBudget
  }

  private static getRetryDelay = (retryCount: number): number => {
    return Math.random() * this.getRetryDelayMaximum(retryCount)
  }

  private static getRetryDelayMaximum = (retryCount: number): number => {
    return 2 ** retryCount * 1000
  }

  private static canScheduleRetry = (error: AxiosError | CustomAxiosError, logger: ILoggerAdapter): boolean => {
    const retryConfig = error.config?.['axios-retry']
    const remainingBudget = this.getRemainingRetryBudgetMs(retryConfig)
    const retryAfter = this.parseRetryAfterMs(error.response?.headers?.['retry-after'])
    const nextRetryDelay = retryAfter ?? this.getRetryDelay((retryConfig?.retryCount ?? 0) + 1)

    if (nextRetryDelay < remainingBudget) {
      if (retryConfig) retryConfig.nextRetryDelayMs = nextRetryDelay
      return true
    }

    logger.warn({
      message: 'Retry budget exhausted',
      metadata: {
        remainingBudget,
        nextRetryDelay,
        retryAfter,
        url: error.config?.url,
        method: error.config?.method
      }
    })

    return false
  }

  // RFC 9110: delay in seconds or an HTTP-date.
  private static parseRetryAfterMs = (header: unknown): number | undefined => {
    if (typeof header !== 'string' || !header.trim()) return undefined

    if (/^\d+$/.test(header.trim())) return Number(header) * 1000

    const date = Date.parse(header)

    return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now())
  }
}

export class CustomAxiosError extends AxiosError<AdditionalAxiosErrorData> {
  data!: {
    message?: string
    code?: number | string
  }
}

declare module 'axios-retry' {
  interface IAxiosRetryConfig {
    operationStartedAt?: number
    nextRetryDelayMs?: number
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
