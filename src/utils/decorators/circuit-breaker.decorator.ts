import OpossumCircuitBreaker, { Options } from 'opossum'

// 🗂️ State management
const events = new Map<string, Map<string, Map<string, string>>>()
const breakerInstances = new Map<string, OpossumCircuitBreaker>()
const instanceConfigs = new Map<string, Options>() // 📊 Store configurations for metrics

// 🎯 Single optimized configuration for production
const CIRCUIT_CONFIG = {
  ERROR_THRESHOLD_PERCENTAGE: 15, // 15% - conservative for production
  VOLUME_THRESHOLD: 20, // 20 minimum requests
  ROLLING_COUNT_TIMEOUT: 10000, // 10s - analysis window
  RESET_TIMEOUT: 30000, // 30s - time to attempt recovery
  ALLOW_WARM_UP: true, // Allow initial warmup
  LOG_THROTTLE_MS: 60000 // 1 min - avoid log spam
}
/**
 * Main Circuit Breaker decorator. It initializes a circuit breaker for each method it decorates and handles its events.
 */
export function CircuitBreaker(params: CircuitBreakerInput = { options: {}, circuitGroup: 'default' }) {
  return function (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor): void {
    const opt: Options = {
      ...(params?.options ?? {}),
      errorThresholdPercentage: params?.options?.errorThresholdPercentage ?? CIRCUIT_CONFIG.ERROR_THRESHOLD_PERCENTAGE,
      volumeThreshold: params?.options?.volumeThreshold ?? CIRCUIT_CONFIG.VOLUME_THRESHOLD,
      rollingCountTimeout: params?.options?.rollingCountTimeout ?? CIRCUIT_CONFIG.ROLLING_COUNT_TIMEOUT,
      resetTimeout: params?.options?.resetTimeout ?? CIRCUIT_CONFIG.RESET_TIMEOUT,
      allowWarmUp: params?.options?.allowWarmUp ?? CIRCUIT_CONFIG.ALLOW_WARM_UP,
      group: params?.circuitGroup ?? 'default'
    }

    const originalMethod = descriptor.value

    descriptor.value = async function (...args: unknown[]) {
      const className = target.constructor.name
      const methodName = propertyKey.toString()

      // 🔑 More specific instance key to avoid collisions
      const instanceKey = `${className}:${methodName}:${opt.group}`

      if (!breakerInstances.has(instanceKey)) {
        const breaker = new OpossumCircuitBreaker(originalMethod.bind(this), opt)
        breakerInstances.set(instanceKey, breaker)
        instanceConfigs.set(instanceKey, opt) // 📊 Store config for metrics

        // 📊 Basic events without verbose logs
        breaker.on('open', () => {
          console.error(`🚨 Circuit breaker OPENED: ${instanceKey}`)
        })

        breaker.on('close', () => {
          console.error(`✅ Circuit breaker CLOSED: ${instanceKey}`)
        })

        breaker.on('halfOpen', () => {
          console.error(`🟡 Circuit breaker HALF-OPEN: ${instanceKey}`)
        })

        // No failure logs to avoid spam

        const classEvents = events.get(className) || new Map()
        const circuitEvents = classEvents.get(opt.group) || new Map()

        for (const [eventName, methodName] of circuitEvents) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (eventName !== 'fallback' && typeof (this as any)[`${methodName}`] === 'function') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            breaker.on(eventName as any, (this as any)[`${methodName}`].bind(this))
          }
        }

        const fallbackMethod = circuitEvents.get('fallback')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (fallbackMethod && typeof (this as any)[`${fallbackMethod}`] === 'function') {
          breaker.fallback(async (args: unknown, error: Error) => {
            console.error(`🔄 Circuit breaker FALLBACK triggered: ${instanceKey}`, {
              className,
              method: methodName,
              group: opt.group,
              error: error.message
            })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return await (this as any)[`${fallbackMethod}`]({ input: args, err: error })
          })
        }
      }

      try {
        return await breakerInstances.get(instanceKey)!.fire(...args)
      } catch (error) {
        // 📊 Structured error log
        console.error(`💥 Circuit breaker execution failed: ${instanceKey}`, {
          className,
          method: methodName,
          group: opt.group,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        throw error
      }
    }
  }
}

/**
 * 📊 Utility function to get metrics from all circuit breakers
 */
export function getCircuitBreakerMetrics() {
  const metrics = new Map<
    string,
    {
      state: string
      stats: {
        fires: number
        failures: number
        fallbacks: number
        latencyMean: number
        percentiles: Record<string, number>
      }
      config: {
        errorThresholdPercentage?: number
        volumeThreshold?: number
        resetTimeout?: number
        rollingCountTimeout?: number
      }
      isOpen: boolean
      isHalfOpen: boolean
    }
  >()

  for (const [key, breaker] of breakerInstances.entries()) {
    const stats = breaker.stats
    const config = instanceConfigs.get(key)

    metrics.set(key, {
      state: breaker.opened ? 'OPEN' : breaker.halfOpen ? 'HALF_OPEN' : 'CLOSED',
      stats: {
        fires: stats.fires || 0,
        failures: stats.failures || 0,
        fallbacks: stats.fallbacks || 0,
        latencyMean: stats.latencyMean || 0,
        percentiles: stats.percentiles || {}
      },
      config: config
        ? {
            errorThresholdPercentage: config.errorThresholdPercentage,
            volumeThreshold: config.volumeThreshold,
            resetTimeout: config.resetTimeout,
            rollingCountTimeout: config.rollingCountTimeout
          }
        : {},
      isOpen: breaker.opened,
      isHalfOpen: breaker.halfOpen
    })
  }

  return Object.fromEntries(metrics)
}

/**
 * 🔧 Utility function for manual reset of a specific circuit breaker
 */
export function resetCircuitBreaker(className: string, methodName: string, group = 'default'): boolean {
  const instanceKey = `${className}:${methodName}:${group}`
  const breaker = breakerInstances.get(instanceKey)

  if (breaker) {
    breaker.close()
    console.error(`🔄 Circuit breaker manually reset: ${instanceKey}`)
    return true
  }

  return false
}

/**
 * 🧹 Utility function for manual cleanup of circuit breakers
 */
export function cleanupCircuitBreakers(): number {
  let cleanedCount = 0

  for (const [key, breaker] of breakerInstances.entries()) {
    breaker.shutdown()
    breakerInstances.delete(key)
    instanceConfigs.delete(key)
    cleanedCount++
  }

  console.error(`🧹 Manually cleaned ${cleanedCount} circuit breaker instances`)
  return cleanedCount
}

/**
 * Decorator to register events in the circuit.
 * Events are stored and used by `CircuitBreaker` when it is instantiated.
 */
export function onEvent({ eventName, circuitGroup = 'default' }: OnEventInput) {
  return function (target: object, propertyKey: string | symbol): void {
    const className = target.constructor.name

    if (!events.has(className)) {
      events.set(className, new Map())
    }

    const classEvents = events.get(className)!
    if (!classEvents.has(circuitGroup)) {
      classEvents.set(circuitGroup, new Map())
    }

    const circuitEvents = classEvents.get(circuitGroup)!
    circuitEvents.set(eventName, propertyKey.toString())
  }
}

/**
 * Input data for configuring a Circuit Breaker.
 */
export type CircuitBreakerInput = {
  /**
   * Optional configuration options for the Circuit Breaker.
   */
  options?: Options

  /**
   * An optional identifier for grouping multiple Circuit Breakers.
   * This allows differentiation between different Circuit Breakers within the same class.
   */
  circuitGroup?: string
}

/**
 * Input data for an event triggered by the Circuit Breaker.
 */
export type OnEventInput = {
  /**
   * The name of the event being triggered.
   */
  eventName: EventType

  /**
   * An optional identifier for grouping multiple Circuit Breakers.
   * This ensures that the event is associated with the correct Circuit Breaker instance.
   */
  circuitGroup?: string
}

/**
 * Input data for the `onHalfOpen` event.
 * Triggered when the Circuit Breaker is in a half-open state, attempting to test whether it can safely close.
 */
export type OnHalfOpenInput = {
  /**
   * The time (in milliseconds) to wait before attempting to re-close the circuit breaker.
   */
  resetTimeout: number
}

/**
 * Input data for the `onFire` event.
 * Triggered when the circuit breaker fires a request, i.e., the original method is invoked.
 */
export type OnFireInput = {
  /**
   * The arguments passed to the original method when the request is fired.
   */
  args: unknown[]
}

/**
 * Input data for the `onSuccess` event.
 * Triggered when the request has successfully executed without errors.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type OnSuccessInput<T = any> = {
  /**
   * The input data that was passed to the original method.
   */
  input: T

  /**
   * The time (in milliseconds) it took for the request to execute.
   */
  latencyMs: number
}

/**
 * Input data for the `onFallback` event.
 * Triggered when a fallback occurs after a failure in the original request.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type OnFallbackInput<T = any> = {
  /**
   * The input data that was passed to the original method.
   */
  input: T

  /**
   * The error that caused the fallback to trigger.
   */
  err: Error
}

/**
 * Input data for the `onFailure` event.
 * Triggered when a request fails and the circuit breaker records the failure.
 */
export type OnFailureInput = {
  /**
   * The error that caused the failure of the request.
   */
  err: Error

  /**
   * The time (in milliseconds) it took before the request failed.
   */
  latencyMs: number

  /**
   * The arguments passed to the original method when the request failed.
   */
  args: unknown[]
}

/**
 * Supported events for the Circuit Breaker (Opossum).
 * When used with `@withEvent`, annotated methods will be triggered automatically
 * when the Circuit Breaker enters any of these states.
 */
type EventType =
  /** The Circuit Breaker is half-open, testing whether it can close again. */
  | 'halfOpen'
  /**
   * Parameters:
   * - `params`: an object containing the `resetTimeout` (in ms), representing the time to wait before attempting to re-close the breaker.
   */
  | 'close'
  /** The Circuit Breaker has closed and is accepting requests normally. */
  | 'open'
  /** The Circuit Breaker has opened due to failures, blocking requests. */
  | 'shutdown'
  /**
   * Parameters:
   * - `params`: an object containing `args`, which are the arguments passed to the original method.
   */
  | 'fire'
  /** A value has been found in the cache, and no request was made. */
  | 'cacheHit'
  /** A value was not found in the cache, triggering the request to be made. */
  | 'cacheMiss'
  /**
   * Parameters:
   * - `params`: an object containing `err`, which is the error that caused the rejection.
   */
  | 'reject'
  /**
   * Parameters:
   * - `params`: an object containing `err`, which is the error causing the timeout.
   */
  | 'timeout'
  /**
   * Parameters:
   * - `params`: an object containing the original `input` data and `latencyMs` (in ms), representing the time it took for the request to execute.
   */
  | 'success'
  /**
   * Parameters:
   * - `params`: an object containing `err`, representing the error causing the semaphore to be locked.
   */
  | 'semaphoreLocked'
  /**
   * Parameters:
   * - `params`: an object containing `err`, representing the error that triggered the health check failure.
   */
  | 'healthCheckFailed'
  /**
   * Parameters:
   * - `params`: an object containing `input` data (any type), and `err` representing the error causing the fallback.
   * - This handler returns any value or a Promise of any value.
   */
  | 'fallback'
  /**
   * Parameters:
   * - `params`: an object containing the original `args` and `latencyMs` (in ms), representing the time it took for the request to fail.
   * - `err`: the error that caused the failure.
   */
  | 'failure'
