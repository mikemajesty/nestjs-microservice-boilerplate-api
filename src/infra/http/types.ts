export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

export type HttpData = Record<string, unknown> | string | number | boolean | null | undefined

/**
 * Input for configuring HTTP request retries.
 */
export type HttpRetryInput = {
  /**
   * The number of times to retry the request.
   */
  retries: number
  /**
   * The HTTP status codes that should trigger a retry. Defaults to `DEFAULT_RETRY_STATUS`.
   */
  retryStatusCodes?: number[]
}
