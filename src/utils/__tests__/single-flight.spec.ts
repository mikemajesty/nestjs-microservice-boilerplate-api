/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/utils/single-flight.md
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/tests/standards.md
 */
import { ApiInternalServerException, ApiServiceUnavailableException } from '../exception'
import { SingleFlight } from '../single-flight'

/** An operation the test resolves or rejects by hand, counting how many times it started. */
const controllable = <T>() => {
  const calls: { resolve: (value: T) => void; reject: (error: Error) => void }[] = []
  const operation = () =>
    new Promise<T>((resolve, reject) => {
      calls.push({ resolve, reject })
    })
  return { operation, calls }
}

describe(SingleFlight.name, () => {
  let singleFlight: SingleFlight

  beforeEach(() => {
    singleFlight = new SingleFlight()
  })

  test('when calls with the same key run concurrently, should run the operation once and share the value', async () => {
    const { operation, calls } = controllable<string>()

    const first = singleFlight.run({ key: 'user:1', operation })
    const second = singleFlight.run({ key: 'user:1', operation })
    await Promise.resolve()
    calls[0].resolve('value')

    await expect(Promise.all([first, second])).resolves.toEqual(['value', 'value'])
    expect(calls).toHaveLength(1)
  })

  test('when calls use different keys, should run one operation per key', async () => {
    const { operation, calls } = controllable<string>()

    const first = singleFlight.run({ key: 'user:1', operation })
    const second = singleFlight.run({ key: 'user:2', operation })
    await Promise.resolve()
    calls[0].resolve('one')
    calls[1].resolve('two')

    await expect(Promise.all([first, second])).resolves.toEqual(['one', 'two'])
    expect(calls).toHaveLength(2)
  })

  test('when the operation fails, should reject every waiter with the same error and allow a retry', async () => {
    const { operation, calls } = controllable<string>()
    const failure = new ApiServiceUnavailableException('database unavailable')

    const first = singleFlight.run({ key: 'user:1', operation })
    const second = singleFlight.run({ key: 'user:1', operation })
    await Promise.resolve()
    calls[0].reject(failure)

    await expect(first).rejects.toBe(failure)
    await expect(second).rejects.toBe(failure)

    const retry = singleFlight.run({ key: 'user:1', operation })
    await Promise.resolve()
    calls[1].resolve('value')
    await expect(retry).resolves.toBe('value')
    expect(calls).toHaveLength(2)
  })

  test('when the operation has settled, should run again on the next call (not a cache)', async () => {
    let calls = 0
    const operation = async () => ++calls

    await expect(singleFlight.run({ key: 'user:1', operation })).resolves.toBe(1)
    await expect(singleFlight.run({ key: 'user:1', operation })).resolves.toBe(2)
  })

  test('when the operation throws synchronously, should reject and release the key', async () => {
    const failure = new ApiInternalServerException('sync failure')
    const throwing = () => {
      throw failure
    }

    await expect(singleFlight.run({ key: 'user:1', operation: throwing })).rejects.toBe(failure)
    await expect(singleFlight.run({ key: 'user:1', operation: () => 'value' })).resolves.toBe('value')
  })

  test('when a key is forgotten, should start a new operation and keep current waiters on the old one', async () => {
    const { operation, calls } = controllable<string>()

    const stale = singleFlight.run({ key: 'user:1', operation })
    singleFlight.forget('user:1')
    const fresh = singleFlight.run({ key: 'user:1', operation })
    await Promise.resolve()
    expect(calls).toHaveLength(2)

    // The old operation settling must not release the key now owned by the fresh one.
    calls[0].resolve('stale')
    await expect(stale).resolves.toBe('stale')
    const joined = singleFlight.run({ key: 'user:1', operation })
    calls[1].resolve('fresh')

    await expect(Promise.all([fresh, joined])).resolves.toEqual(['fresh', 'fresh'])
    expect(calls).toHaveLength(2)
  })
})
