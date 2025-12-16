import { red } from 'colorette'
import { Worker } from 'worker_threads'

import { ApiTimeoutException } from '../../exception'

export function RunInNewThread(timeout?: number) {
  return function (target: object, key: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: unknown[]): Promise<unknown> {
      return new Promise((resolve, reject) => {
        const fnCode = originalMethod.toString()

        // Support both ts-node and compiled JavaScript
        const workerFile = __filename.endsWith('.ts')
          ? `${__dirname}/thread.ts`
          : `${__dirname}/thread.js`

        const worker = new Worker(workerFile, {
          execArgv: __filename.endsWith('.ts') ? ['-r', 'ts-node/register'] : []
        })
        let timeoutId: NodeJS.Timeout | null = null
        let isResolved = false

        const cleanup = () => {
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
          worker.terminate()
        }

        const resolveOnce = (value: unknown) => {
          if (!isResolved) {
            isResolved = true
            cleanup()
            resolve(value)
          }
        }

        const rejectOnce = (error: Error) => {
          if (!isResolved) {
            isResolved = true
            cleanup()
            reject(error)
          }
        }

        worker.postMessage([fnCode, args])

        if (timeout) {
          timeoutId = setTimeout(() => {
            const className = target.constructor.name
            const methodName = key
            const error = new ApiTimeoutException('Worker execution timed out.', { timeout })
            Object.assign(error, { context: `${className}/${methodName}` })
            rejectOnce(error)
          }, timeout)
        }

        worker.once('message', (value: { error?: unknown; success?: unknown }) => {
          if (value.error) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const errorObj = value.error as any
            const error = new Error(errorObj.message || 'Worker execution failed')
            if (errorObj.stack) {
              error.stack = errorObj.stack
            }
            rejectOnce(error)
          } else {
            resolveOnce(value.success)
          }
        })

        worker.once('error', (err: Error) => {
          if (err.name === 'ReferenceError') {
            console.error(red('Worker reference error: '), err.message)
            rejectOnce(new Error('Reference error in worker: ' + err.message))
          } else {
            rejectOnce(err)
          }
        })

        worker.once('exit', (code: number) => {
          if (code !== 0 && !isResolved) {
            rejectOnce(new Error(`Worker stopped with exit code ${code}`))
          }
        })
      })
    }

    return descriptor
  }
}
