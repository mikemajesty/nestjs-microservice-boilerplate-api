/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/utils/single-flight.md
 */

/**
 * Deduplicates concurrent calls by key: while an operation for a key is running, other calls
 * with the same key wait for it instead of starting their own. Modeled on Go's singleflight.Group.
 *
 * - Not a cache: once the operation settles, the key is released and the next call runs again.
 * - Callers waiting on the same key receive the same value or the same rejection.
 * - Process-local: each instance (and each pod) deduplicates only its own calls.
 * - No timeout: a stuck operation keeps its waiters stuck; callers bound it (see Deadline).
 */
export class SingleFlight {
  private readonly pending = new Map<string, Promise<unknown>>()

  run<T>({ key, operation }: SingleFlightRunInput<T>): Promise<T> {
    const existing = this.pending.get(key)

    if (existing) {
      return existing as Promise<T>
    }

    const promise = Promise.resolve().then(operation)
    this.pending.set(key, promise)

    const release = () => {
      if (this.pending.get(key) === promise) {
        this.pending.delete(key)
      }
    }
    promise.then(release, release)

    return promise
  }

  /**
   * Releases the key without waiting: the next run() starts a new operation, while callers
   * already waiting keep the current one. Use it when the in-flight result became stale,
   * e.g. right after invalidating the data it is loading.
   */
  forget(key: string): void {
    this.pending.delete(key)
  }
}

export type SingleFlightRunInput<T> = {
  key: string
  operation: () => Promise<T> | T
}
