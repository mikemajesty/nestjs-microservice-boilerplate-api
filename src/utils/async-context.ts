/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/utils/async-context.md
 */
import { AsyncLocalStorage } from 'node:async_hooks'

/**
 * Thin wrapper around Node's `AsyncLocalStorage`, used to propagate a value across an
 * asynchronous call chain (e.g. a request handler and everything it awaits) without
 * threading it through every function signature in between. Each cross-cutting concern
 * (deadline, request context, locale, etc.) owns its own `AsyncContext<T>` instance.
 */
export class AsyncContext<T> {
  private readonly storage = new AsyncLocalStorage<T>()

  run<R>(value: T, callback: () => R): R {
    return this.storage.run(value, callback)
  }

  getCurrent(): T | undefined {
    return this.storage.getStore()
  }
}
